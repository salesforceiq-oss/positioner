# bedrock

Easy way to make new pure js or web app repos

1. cd ~/projects
2. mkdir <project-name>
3. cd <project-name>
4. git init
// note: if you are not an owner this will create a repo you can't access right now
//instead do step 4.b
5.a. git create relateiq/<project-name> 
5.b.1 go to github and create the repo <project-name>
5.b.2 git remote add -p origin relateiq/<project-name>
6. git remote add bedrock git://github.com/relateiq/bedrock.git
7. git fetch bedrock
8. git merge bedrock/<branch-name-eg-web-or-vanilla>
9. npm init
10. enter your package name
11. git commit -m "init package"
12. git push -uf origin master
