Node.js code for indexing from an HTTP API to Elasic Search, using request and elastic search stream modules 

Used for indexing from Jira and Artifactory to ES.

To use, clone, install node.js, run ```npm install```, then call requestToElasticSearch.js with node. First param to requestToElasticSearch.js is the config file to use. This will be ```require```'d. Subsequent params are generally speicifed in the config file: in this example, getting Jira items updated in past 24 hours: 

```node requestToElasticSearch.js jiraSampleConfig -24h``` 

