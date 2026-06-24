class AppError(Exception):
    """Erreur applicative portant un code machine explicite.

    N'hérite PAS de HTTPException : elle a son propre handler dédié.
    """

    def __init__(self, code: str, message: str, status: int) -> None:
        self.code = code
        self.message = message
        self.status = status
        super().__init__(message)

    @classmethod
    def bad_request(cls, code: str, message: str) -> "AppError":
        return cls(code, message, 400)

    @classmethod
    def unauthorized(cls, code: str, message: str) -> "AppError":
        return cls(code, message, 401)

    @classmethod
    def forbidden(cls, code: str, message: str) -> "AppError":
        return cls(code, message, 403)

    @classmethod
    def not_found(cls, code: str, message: str) -> "AppError":
        return cls(code, message, 404)

    @classmethod
    def conflict(cls, code: str, message: str) -> "AppError":
        return cls(code, message, 409)
