package com.closeby.common;

import org.springframework.http.HttpStatus;

public class CloseByException extends RuntimeException {

    private final HttpStatus status;

    public CloseByException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static CloseByException badRequest(String message) {
        return new CloseByException(HttpStatus.BAD_REQUEST, message);
    }

    public static CloseByException unauthorized(String message) {
        return new CloseByException(HttpStatus.UNAUTHORIZED, message);
    }

    public static CloseByException forbidden(String message) {
        return new CloseByException(HttpStatus.FORBIDDEN, message);
    }

    public static CloseByException notFound(String message) {
        return new CloseByException(HttpStatus.NOT_FOUND, message);
    }

    public static CloseByException conflict(String message) {
        return new CloseByException(HttpStatus.CONFLICT, message);
    }
}
