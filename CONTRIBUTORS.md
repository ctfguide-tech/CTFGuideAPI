Contributing
-------
*Branches:*<br>
1. Master - The branch contains working releases of the API. It is the code running in prod.
2. Dev - The branch contains unreleased versions of the API.
3. Other Branches - These might be feature branches.<br>

*Testing*:<br>
1. On every Pull Request into the Dev Branch, run automated GitHub actions.

Setting up local dev environment
-------
1. Install dependencies: `npm install`
2. Setup Firebase: ![Firebase Setup Docs]()
3. Setup MongoDB credentials
4. Fill out secret fields in `./private/secret.json`

Pull Requests
-------
Make pull requests into dev branch