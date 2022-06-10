# Using Local 

## Setting Up Environment for Machine Learning Service
Python environment can be created using [pipenv](https://pipenv.pypa.io/en/latest/) package by Python. In this project, pipenv is a tool that has been chosen for setting up environment. For starting things off, download any Python version from this [link](https://www.python.org/downloads/). After that, go to command line and run command this command for installing pipenv package: 

```pip install pipenv``` 

Copy this folder into your local data or clone the GitHub repo by running command:

```git clone https://github.com/marcellinus-witarsah/VePay-Go-ML-Demo.git```

Then setting up the environment at your project directory folder ```ml-service``` by running this command for automatically create an environment and install all dependencies from Pipfile: 

```python -m pipenv install```

Then you want to access or activate the environment using this command: 

```python -m pipenv shell```

The machine learning service will be run on Flask server and to run it, type this command to : 
```python main.py```

Then see the address of the server. Next, copy and paste the link to ```PYTHON_SERVICE_URL``` constant inside src\constants.js

## Setting Up React.js Website
Copy this folder into your local data or clone the GitHub repo by running command:

```git clone https://github.com/marcellinus-witarsah/VePay-Go-ML-Demo.git```

In VePay-Go-ML-Demo folder please run this command to install all dependencies:
```npm install```

Then all settings are done, you can run the website using this command and visit the link that pop up in the command line:
```npm start```
