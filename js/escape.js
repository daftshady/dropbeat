function titleEscape(title) {
    // Temporal workaround for underscore.js
    // classic escape '\\"' doesn't work well.
    if (title) {
        return title.replace(/"/g, "'");
    }
}
