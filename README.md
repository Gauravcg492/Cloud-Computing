# Cloud-Computing
## Steps to run the project :
Create three instances. 

Add the repository in all three instances. 

Set up AWS target groups and an application load balancer for the first two instances.

Install docker and docker-compose on all three instances. You can follow https://cwiki.apache.org/confluence/pages/viewpage.action?pageId=94798094.

In the first instance, run `$ cd Project/Rides`, and then `$ sudo docker-compose up --build`

In the second instance, run `$ cd Project/Users`, and then `$sudo docker-compose up --build`

In the third instance, run `$ cd Project`, and then `$ sudo docker-compose up --build`
