# Developing

The WebGPU CTS is written in TypeScript.

## Setup

After checking out the repository and installing node/npm, run:

```sh
npm ci
```

`npm run` will show available npm scripts.
Some more scripts can be listed using `npx grunt`.

## Dev Server

To start the development server, use:

```sh
npm start
```

Then, browse to the standalone test runner at the printed URL.

The server will generate and compile code on the fly, so no build step is necessary.
Only a reload is needed to see saved changes.
(TODO: except, currently, `README.txt` and file `description` changes won't be reflected in
the standalone runner.)

Note: The first load of a test suite may take some time as generating the test suite listing can
take a few seconds.

## Standalone Test Runner / Test Plan Viewer

**The standalone test runner also serves as a test plan viewer.**
(This can be done in a browser without WebGPU support.)
You can use this to preview how your test plan will appear.

You can view different suites (webgpu, unittests, stress, etc.) or different subtrees of
the test suite.

- `http://localhost:8080/standalone/` (defaults to `?runnow=0&worker=0&debug=0&q=webgpu:*`)
- `http://localhost:8080/standalone/?q=unittests:*`
- `http://localhost:8080/standalone/?q=unittests:basic:*`

The following url parameters change how the harness runs:

- `runnow=1` runs all matching tests on page load.
- `debug=1` enables verbose debug logging from tests.
- `worker=1` runs the tests on a Web Worker instead of the main thread.

## Editor

Since this project is written in TypeScript, it integrates best with
[Visual Studio Code](https://code.visualstudio.com/).
This is optional, but highly recommended: it automatically adds `import` lines and
provides robust completions, cross-references, renames, error highlighting,
deprecation highlighting, and type/JSDoc popups.

Open the `cts.code-workspace` workspace file to load settings convienient for this project.
You can make local configuration changes in `.vscode/`, which is untracked by Git.

## Pull Requests

Opening a pull request will automatically notify reviewers.

To make the review process smoother, once a reviewer has started looking at your change:

- Avoid major additions or changes that would be best done in a follow-up PR.
- Avoid rebases (`git rebase`) and force pushes (`git push -f`). These can make
  it difficult for reviewers to review incremental changes as GitHub often cannot
  view a useful diff across a rebase. If it's necessary to resolve conflicts
  with upstream changes, use a merge commit (`git merge`) and don't include any
  consequential changes in the merge, so a reviewer can skip over merge commits
  when working through the individual commits in the PR.
- When you address a review comment, mark the thread as "Resolved".

Pull requests will (usually) be landed with the "Squash and merge" option.
