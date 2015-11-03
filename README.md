# bedrock

Foundation for web libraries, modules, and applications.

Check out [the wiki](https://github.com/relateiq/bedrock/wiki) for more information on
how to use `iqb` after cloning.

# bootstrapping

## iqproj method

Use the `iqproj` command to create and update repositories based off bedrock.

```
$ iqproj new weblib my-project

--------------------------------------------------------------
Before continuing, the target repository must exist in
github.  If you haven't already done so, go to this URL:

   https://github.com/organizations/relateiq/repositories/new

And create a repository named 'my-project'
--------------------------------------------------------------
Press ENTER when ready...

~/projects ~/projects
Initialized empty Git repository in /Users/jchrzanowski/projects/my-project/.git/
remote: Counting objects: 224, done.
remote: Total 224 (delta 0), reused 0 (delta 0), pack-reused 224
Receiving objects: 100% (224/224), 34.29 KiB | 0 bytes/s, done.
Resolving deltas: 100% (121/121), done.
From git://github.com/relateiq/bedrock
 * [new branch]      master     -> bedrock/master
 * [new branch]      vanilla    -> bedrock/vanilla
 * [new branch]      web        -> bedrock/web
[master 4835955] init package my-project
 1 file changed, 6 insertions(+), 7 deletions(-)
Counting objects: 193, done.
Delta compression using up to 8 threads.
Compressing objects: 100% (84/84), done.
Writing objects: 100% (193/193), 30.90 KiB | 0 bytes/s, done.
Total 193 (delta 106), reused 187 (delta 104)
--------------------------------------------------------------
DONE.  Created my-project
~/projects
```

## manual method

prereq:  `brew install hub`

1. `cd ~/projects`
2. `mkdir project-name`
3. `cd project-name`
4. `git init`
5. Create the github repo for the project
  1. Create repo from command line  note: if you are not an owner this will create a repo you can't access right now, instead do step 5.ii
    1. `git create relateiq/project-name`
  2. manually create github repo
    1. go to github and create the repo project-name
    2. `git remote add -p origin relateiq/project-name`
6. `git remote add bedrock git://github.com/relateiq/bedrock.git`
7. `git fetch bedrock`
8. `git merge bedrock/branch-name-eg-web-or-vanilla`
9. `npm init`
10. enter your package name
11. `git commit -m "init package"`
12. `git push -uf origin master`


# feature management

The bedrock skeleton provides an easy way to enable additional features via the `iqb` tool.
To enable/disable features, run:

```
iqb feat enable|disable featurename
```

## Features

### `app`: index.html, local server, sass, browserify, livereload
This feature should be enabled when the module contains a mini-application that's used
for feature testing, examples, or whatever.  The `browserify` feature is automatically 
enabled as part of this feature.

Uses src/styles/packagename.scss as an entry point.

### `headless`: run karma tests in a headless firefox instance

