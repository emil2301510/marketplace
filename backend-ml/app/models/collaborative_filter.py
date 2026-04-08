"""
Collaborative Filtering using SVD (Singular Value Decomposition).
Approach: Matrix Factorization — decomposes the user-item rating matrix
into latent factors to predict unknown ratings and generate recommendations.
"""
import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds
from sklearn.preprocessing import LabelEncoder
import pickle
import os

MODEL_PATH = "model.pkl"


class CollaborativeFilter:
    def __init__(self, n_factors: int = 20):
        self.n_factors = n_factors
        self.user_enc = LabelEncoder()
        self.item_enc = LabelEncoder()
        self.predicted_ratings = None
        self.user_ids = []
        self.product_ids = []
        self.trained = False

    def train(self, ratings: list[dict]) -> dict:
        """
        Train SVD model on ratings data.
        ratings: [{"userId": str, "productId": str, "rating": int}]
        """
        if len(ratings) < 5:
            return {"status": "not enough data", "min_required": 5, "got": len(ratings)}

        df = pd.DataFrame(ratings)
        df['user_idx'] = self.user_enc.fit_transform(df['userId'])
        df['item_idx'] = self.item_enc.fit_transform(df['productId'])

        self.user_ids = list(self.user_enc.classes_)
        self.product_ids = list(self.item_enc.classes_)

        n_users = len(self.user_ids)
        n_items = len(self.product_ids)

        # Build sparse matrix
        matrix = csr_matrix(
            (df['rating'].values, (df['user_idx'].values, df['item_idx'].values)),
            shape=(n_users, n_items),
            dtype=np.float32,
        )

        # Mean-center by user
        user_ratings_mean = np.array(matrix.mean(axis=1)).flatten()
        matrix_demeaned = matrix.toarray() - user_ratings_mean.reshape(-1, 1)

        # SVD decomposition
        k = min(self.n_factors, min(n_users, n_items) - 1)
        U, sigma, Vt = svds(matrix_demeaned, k=k)
        sigma_diag = np.diag(sigma)

        # Reconstruct predicted ratings
        self.predicted_ratings = user_ratings_mean.reshape(-1, 1) + np.dot(np.dot(U, sigma_diag), Vt)
        self.trained = True

        self.save()
        return {
            "status": "trained",
            "users": n_users,
            "products": n_items,
            "ratings": len(ratings),
            "factors": k,
        }

    def recommend_for_user(self, user_id: str, top_n: int = 10) -> list[str]:
        """Return top-N product IDs for a user (exclude already rated)."""
        if not self.trained:
            self.load()
        if not self.trained or user_id not in self.user_ids:
            return []

        user_idx = self.user_ids.index(user_id)
        scores = self.predicted_ratings[user_idx]

        # Sort descending
        ranked = np.argsort(scores)[::-1]
        return [self.product_ids[i] for i in ranked[:top_n]]

    def similar_products(self, product_id: str, top_n: int = 8) -> list[str]:
        """Find similar products using item-item cosine similarity."""
        if not self.trained:
            self.load()
        if not self.trained or product_id not in self.product_ids:
            return []

        item_idx = self.product_ids.index(product_id)
        item_matrix = self.predicted_ratings.T  # shape: (n_items, n_users)

        target = item_matrix[item_idx]
        norms = np.linalg.norm(item_matrix, axis=1)
        target_norm = np.linalg.norm(target)
        if target_norm == 0:
            return []

        similarities = item_matrix.dot(target) / (norms * target_norm + 1e-9)
        similarities[item_idx] = -1  # exclude self

        ranked = np.argsort(similarities)[::-1]
        return [self.product_ids[i] for i in ranked[:top_n]]

    def save(self):
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self, f)

    def load(self):
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                loaded: CollaborativeFilter = pickle.load(f)
                self.predicted_ratings = loaded.predicted_ratings
                self.user_ids = loaded.user_ids
                self.product_ids = loaded.product_ids
                self.user_enc = loaded.user_enc
                self.item_enc = loaded.item_enc
                self.trained = loaded.trained


# Singleton
_model: CollaborativeFilter | None = None


def get_model() -> CollaborativeFilter:
    global _model
    if _model is None:
        _model = CollaborativeFilter(n_factors=20)
        _model.load()
    return _model
