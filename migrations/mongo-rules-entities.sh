#-u root -p root --authenticationDatabase='admin'
mongorestore -d api-factory -c entities --drop ./release_dump_18_07_2018_17_50/api-factory/entities.bson
mongorestore -d api-factory -c tableentity_5a95044e265be107208275c9 --drop ./release_dump_18_07_2018_17_50/api-factory/tableentity_5a95044e265be107208275c9.bson
