from flask import Flask,render_template,url_for,request,jsonify
from dotenv import load_dotenv #loads the api keys
from groq import Groq
import os
load_dotenv()
#create the flask app
app=Flask(__name__)
#set the password to access the app
app.secret_key=os.getenv("ijlal080914","app secret key")
GROQAPIKEY=os.getenv("GROQAPIKEY")
if not GROQAPIKEY:
    print("GROQ API KEY NOT FOUND!")
#groq model
groqmodel=Groq(api_key=GROQAPIKEY)
MODEL = "llama-3.3-70b-versatile"
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
#generate notes function
@app.route("/generate" methods=["POST"])
def generate_notes():
    try: #to get the data from the form
        data=request.get_json()
        if not data:
            return jsonify({"success";False,"error":"No data was fetched."}),400
        #fetch the data
        title=data.get("title","").strip()
        topics=data.get("topicslist",[])
        notetype=data.get("note_type",["Detailed Notes","Exam Tips and Quizzes","Essay Format","Beginner Friendly","Quick Revision"])
        pages=data.get("pages",3)
        outline=data.get("notetype",["Detailed Notes","Exam Tips and Quizzes","Essay Format","Beginner Friendly","Quick Revision"])
        grade=data.get("grade","")
        examples=data.get("examples",True)
        exercises=data.get("exercises"<True)
        summary=data.get("summary",True)
if __name__=='__main__':
    app.run(debug=True)