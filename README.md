# AirTribe internship assignment

Description can be found on [link](https://airtribe.notion.site/Internship-Assignment-Backend-51350436132a425aafa6bab75f48b1ef)

## Run Locally
Add env file name config.env and create a var name  DATABASE={link for your mongodb database}
Clone the project(Not public yet)

```bash
  git clone https://github.com/SSJay5/Airtribe-assignment.git
```

OR

1. Download the zip file [download](https://drive.google.com/file/d/1nqeyvA5w9LSOd6-LGPCv4CHfdUtRqBg6/view?usp=sharing)
2. Unzip the downloaded file

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

## Steps to solution

### Web scraping

1. In order to browse various category of questions(ie Newest,Active,Bountied etc ) we first need to find the links of them on the page. These categories can be see on top-right side of the page Function <strong>getAllCategoriesOfQUestions</strong> returns List of url's of these categories.
2. Once we have link for the starting page of the category we need to traverse all the pages under those categories so we first find total number of pages, function <strong>getInitialContents</strong> first finds total number of pages.
3. We now have total number of pages under each category so we can traverse each page and parse the questions. Page number is selected using query parameter <strong>page</strong> (on observation) in the url.
4. On traversing each page we scrap question link, number of votes and number of answers. After scraping the contents we store in our database which will be of type (key)<strong>url :</strong>(value)<strong>
   count of number of times question appeared, number of votes, number of answers</strong>.
5. When user kills the script using ctlr + c we paste contents of our javascript object into a csv file by extracting only 100 questions at a time.

### Concurrency Control

- We fist define time interval at which enqueued requests retire <strong>pollRate</strong>
- We the define a<strong> sleep</strong> function that pauses function for pollRate time period because we are having 5 request running our background
- We define a global variable which keeps track of number of requests currently running in the background <strong>currRunning</strong>

1. While making a request we first check if we have less than 5 requests running in our background
2. If yes then we make the request and increment currRunning by one, once the request is resolved we decrement currRunning and return the result
3. If no the we pause the function for pollRate using sleep function
