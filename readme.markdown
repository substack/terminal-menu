This is a fork of https://github.com/substack/terminal-menu with a small fix to the code to allow it to run in windows 8.1 and other slightly wonky terminals that don't deal with `process.stdin.setRawMode(false)` in the middle of a program run. If/when that PR lands in the main repo, I'll unfork this repo and the `terminal-menu-program` package will go back to pointing straight to the regular `terminal-menu` package.

- Pomax
