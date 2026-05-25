package com.zenelait.lms.util;

public class Safe {

    public static <T> T get(T value, T fallback) {
        return value != null ? value : fallback;
    }

    public static String str(Object o) {
        return o != null ? o.toString() : null;
    }

    public static Long toLong(Object o) {
        return o != null ? Long.valueOf(o.toString()) : null;
    }

    public static Integer toInt(Object o) {
        return o != null ? Integer.valueOf(o.toString()) : null;
    }
}
