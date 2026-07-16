package com.homelens.marketanalysis.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.homelens.marketanalysis.dto.ErrorResponse;
import com.homelens.marketanalysis.exception.InvalidMarketFilterException;
import com.homelens.marketanalysis.exception.MlApiUnavailableException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidMarketFilterException.class)
    public ResponseEntity<ErrorResponse> invalidFilter(InvalidMarketFilterException error) {
        return ResponseEntity.badRequest().body(new ErrorResponse(error.getMessage()));
    }

    @ExceptionHandler(MlApiUnavailableException.class)
    public ResponseEntity<ErrorResponse> mlApiUnavailable(MlApiUnavailableException error) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
            .body(new ErrorResponse("Prediction service unavailable"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> invalidBody(MethodArgumentNotValidException error) {
        String detail = error.getBindingResult().getFieldErrors().stream()
            .findFirst()
            .map(fieldError -> fieldError.getField() + " " + fieldError.getDefaultMessage())
            .orElse("Invalid request");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(detail));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> invalidQueryParameter(MethodArgumentTypeMismatchException error) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("Invalid request parameter"));
    }
}
