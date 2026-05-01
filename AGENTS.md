# Critical System Instructions for Code Generation & Modification

You MUST STRICTLY adhere to the following rules in all future code generations, modifications, or GitHub syncing. NEVER change, delete, or overwrite the following configurations:

1. **The App Icon File:** The file `/public/Icon.png` (with a capital 'I') MUST be preserved exactly as it is. Do NOT delete it, modify it, or remove it from the repository. Note that the correct path in a Vite/React public folder is usually `public/Icon.png`, but referred to as `/Icon.png` in HTML.
2. **The manifest.json File:** Never alter the `name`, `short_name`, or the icon paths in `public/manifest.json`. The `short_name` MUST remain `"قناة الاتحاد"`, and the icon paths MUST remain `/Icon.png`.
3. **The index.html Head Tags:** Never remove or modify the `apple-touch-icon` or `apple-mobile-web-app-title` meta tags in the `<head>`. They must always point to `/Icon.png` and output the title `"قناة الاتحاد"`.

Under no circumstances should you reset these PWA configurations or stage their removal for Vercel/GitHub. Consider these files and lines of code LOCKED.
