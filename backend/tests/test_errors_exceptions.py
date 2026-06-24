from app.errors.codes import STATUS_CODE_MAP, ErrorCode
from app.errors.exceptions import AppError


def test_app_error_carries_code_message_status():
    err = AppError("INSUFFICIENT_STOCK", "Stock insuffisant.", 400)
    assert err.code == "INSUFFICIENT_STOCK"
    assert err.message == "Stock insuffisant."
    assert err.status == 400
    assert str(err) == "Stock insuffisant."


def test_app_error_factories_set_status():
    assert AppError.not_found("NOT_FOUND", "x").status == 404
    assert AppError.unauthorized("UNAUTHORIZED", "x").status == 401
    assert AppError.bad_request("BAD_REQUEST", "x").status == 400
    assert AppError.forbidden("FORBIDDEN", "x").status == 403
    assert AppError.conflict("CONFLICT", "x").status == 409


def test_status_code_map_and_codes_exist():
    assert STATUS_CODE_MAP[404] == "NOT_FOUND"
    assert STATUS_CODE_MAP[401] == "UNAUTHORIZED"
    assert ErrorCode.INTERNAL_ERROR == "INTERNAL_ERROR"
    assert ErrorCode.VALIDATION_ERROR == "VALIDATION_ERROR"
