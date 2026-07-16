package com.homelens.marketanalysis.exception;

public class MlApiUnavailableException extends RuntimeException {

    public MlApiUnavailableException(String message) {
        super(message);
    }

    public MlApiUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
