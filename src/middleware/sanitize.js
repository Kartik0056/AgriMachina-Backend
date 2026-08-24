const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string' && key !== 'description' && key !== 'terms') {
        // Strip potential script injections
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [],
          allowedAttributes: {}
        }).trim();
      } else if (typeof req.body[key] === 'string' && (key === 'description' || key === 'terms')) {
        // Safe rich text HTML sanitization
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3', 'h4', 'table', 'tr', 'td', 'th', 'thead', 'tbody']),
          allowedAttributes: {
            ...sanitizeHtml.defaults.allowedAttributes,
            '*': ['style', 'class'],
            'img': ['src', 'alt', 'width', 'height', 'loading'],
            'a': ['href', 'name', 'target', 'rel']
          }
        });
      }
    }
  }
  next();
};

module.exports = {
  sanitizeInput
};
