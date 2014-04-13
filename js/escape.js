function titleEscape(title) {
    // Temporal workaround for underscore.js
    // classic escape '\\"' doesn't work well.
    if (title != null) {
        return title.replace(/"/g, "'");
    }
}
