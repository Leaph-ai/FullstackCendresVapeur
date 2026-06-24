import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.errors.codes import STATUS_CODE_MAP, ErrorCode
from app.errors.exceptions import AppError

logger = logging.getLogger("app.errors")


def _envelope(code: str, message: str, status: int, **extra: object) -> dict:
    error: dict[str, object] = {"code": code, "message": message, "status": status}
    error.update(extra)
    return {"error": error}


async def _app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status,
        content=_envelope(exc.code, exc.message, exc.status),
    )


async def _http_exception_handler(
    _request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    code = STATUS_CODE_MAP.get(exc.status_code, ErrorCode.HTTP_ERROR)
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=_envelope(code, detail, exc.status_code),
        headers=getattr(exc, "headers", None),
    )


async def _validation_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    fields = [
        {
            "field": ".".join(str(p) for p in err["loc"] if p != "body"),
            "msg": err["msg"],
        }
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=_envelope(
            ErrorCode.VALIDATION_ERROR, "Données invalides.", 422, fields=fields
        ),
    )


async def _unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Erreur non gérée", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=_envelope(
            ErrorCode.INTERNAL_ERROR, "Une erreur interne est survenue.", 500
        ),
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, _app_error_handler)
    app.add_exception_handler(RequestValidationError, _validation_handler)
    app.add_exception_handler(StarletteHTTPException, _http_exception_handler)
    app.add_exception_handler(Exception, _unhandled_exception_handler)
