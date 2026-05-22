# Logo

The shipped logo is a placeholder SVG (`logo.svg`) using the Advanced Companies brand-red palette.

To use the real Advanced Companies logo:

1. From the Employee Handbook Dashboard at <https://advanced-company-handbook.up.railway.app/Advanced_Handbook_Dashboard.html>, open the browser console and run:
   ```js
   copy(window.HANDBOOK_DATA.logo)
   ```
2. Paste the resulting `data:image/...;base64,...` string into the browser address bar, then save the rendered image as `logo.jpg` (or `logo.png`).
3. Drop the file into this directory, overwriting the placeholder.
4. If the saved file is not `.svg`, update the four EJS references:
   - `views/partials/head.ejs`
   - `views/partials/navbar.ejs`
   - `views/auth/login.ejs`
   - `views/training/certificate.ejs`

All `<img>` tags ship with `onerror="this.style.display='none'"` so a missing logo will not break the layout.
