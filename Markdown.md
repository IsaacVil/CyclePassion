# Proyecto Mi moto mi pasión
The project consists in an API Serverless for the exchange of motorcycle parts, where users can post their parts and others can consult them based on type or category, using decoupled functions, using a serverless architecture.

It will execute all the code without real AWS access.

## Authors
 * Isaac Villalobos Bonilla, 2024124285
 * Christopher Daniel Vargas Villalta, 2024108443
   
---
## Architecture
* Serverless with Lambda functions
* REST
* Serverless-offline plugin to emulate AWS Lambda and API Gateway

---
## Database Architecture
* Local DynamoDB will be the database engine of choice for the project
* It will contain a small seeded dataset loaded automatically
* Structure: Pk id (uuid), Attributes: nombre (string), tipo (string), precio (float), categorias (array).
* Primary key id, Tipo, Categoria doesnt have a Sort key only a Partition key, meaning an item is unique by its id.
* tipo-categoria (compose index) uses a Partition-Sort key to find more quickly the data, it orders the bucket (of data equal to that partition key) based on the sort key on a tree.


---
## Workflow 1 (Post motorcycle parts)
* Step 1. The user sends the json via "Post /partes"
* Step 2. The json contains name, type, price, categories that the part belongs to.
* Step 3. The endpoint /partes takes care of the insertion on local DynamoDB, making sure it sticks to all the business rules and logic.

---
## Workflow 2 (Get motorcycle parts based on categories or type)
* Step 1. The user sends the informacion via header on "Get /partes?tipo=x
* Step 2. The header may contain type, categories.
* Step 3. The endpoint will return a response of all the parts in DynamoDB that match the type of the categories.

---
## RESTAPI Testing (for workflow 1 and 2)
* It will use Postman for HTTP request and response.
* In /Postman_Test will have QA test for both workflows

---
## Layered design
* The API serveless is based on an layered architecture.
* The Business Logic layer: Takes care of data type validations on the get and set workflows.
* Repositories layer: Takes care of the communication between the DB.
* Model layer: Defines the structure of a motorcycle part

---
## Scripts
* It will use local AWS SDK and plugins like serverless-online for the scripting.
* It will have offline serverless scripts for devs.
* It will have a simulated deployment script for production.

---
## Paradigm
* Imperative: We give detailed instructions to achieve a result.
* Define pasos explícitos de ejecución (recibir request, validar, consultar/insertar, responder).
* Define explicit steps of execution (validation, consult/insert, response, request).
* It has secundary direct effects (read/write on DynamoDB).
