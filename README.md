# VERSOVA public website

Official public company and product-information website for **베르소바(Versova) / Versova**, an individual business. Corporate CI is the owner-supplied monochrome October 2026 identity. The company logo is separate from Yesterday's Me's product icon.

Production URL: https://489156.github.io/versova-site/

| Route | Content |
|---|---|
| `/` | Company introduction and public registration details |
| `/yesterdays-me/` | Yesterday's Me, preparing for release |
| `/yesterdays-me/privacy/` | Current product privacy policy |
| `/yesterdays-me/support/` | Current product support |
| `/privacy/`, `/support/` | Compatible legacy policy/support routes |

## Maintenance

HTML, CSS and logo assets are generated from the private `489156/Versova` source workspace. Change the company metadata, product catalog, privacy dictionaries or support source there, run the root verification command, then publish the manifest-approved output here. Do not edit generated pages directly.

`publication-manifest.json` contains SHA-256 hashes of every public output and source-input fingerprints. It deliberately contains no certificate scan, personal identification data or private source contents. The only certificate-derived facts published here are selected business facts already intended for the company site.

Verify with Node 20+: `node tools/check-public-site.mjs .`. GitHub Actions runs the same checks for pushes and PRs. GitHub Pages remains configured through repository Settings → Pages; this workflow verifies content and does not change hosting configuration.

The checked-in corporate SVGs are web reconstructions of supplied raster CI references. Original outlined vector/print masters can replace them later through the source repository. The website does not imply the mobile app has launched or claim that all future VERSOVA products are local-only.
