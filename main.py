from flask import Flask,render_template,url_for
from dotenv import load_dotenv #loads the api keys
load_dotenv()
#create the flask app
app=Flask(__name__)
#set the password to access the app
app.secret_key="ijlal080914"
#configure the routing
@app.route('/')
def home():
    return render_template('index.html')
@app.route('/studio')
def studio():
    return render_template('studio.html')
@app.route('/library')
def library():
    return render_template('library.html')
if __name__=='__main__':
    app.run(debug=True)