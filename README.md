# bedrock

Easy way to make new pure js or web app repos

1. cd ~/projects
2. git clone --origin bedrock relateiq/bedrock <project-name>
3. cd <project-name>
// note: if you are not an owner this will create a repo you can't access right now
//instead do step 4.b
4.a. git create relateiq/<project-name> 
4.b.1 go to github and create the repo <project-name>
4.b.2 git remote add -p origin relateiq/<project-name>
5. git push -u origin master
6. git fetch bedrock
7. git merge bedrock/<branch-name-eg-web-or-vanilla>
8. npm init
9. enter your package name
10. git commit -m "init package"
11. git push
