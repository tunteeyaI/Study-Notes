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
        #check if the values have been entered
        if not title:
           return jsonify({
               "success":False,
               "error":"Please enter a title"
           }),400
        if not topics:
            return jsonify({
                "success":False,
                "error":"Please enter a topic"
            }),400
        #converting the topics into text
        if isinstance(topics,list):
            topic_text=",".join(topics)
        else: #one topic
            topic_text=str(topics)
        prompt = f"""
You are an expert educational notes creator.
Create a complete study notebook for a student.
NOTEBOOK TITLE:
{title}
TOPICS:
{topic_text}
NOTE TYPE:
{notetype}
NUMBER OF PAGES:
Approximately {pages} pages
OUTLINE:
{outline}
GRADE:
{grade if grade else "General student level"}
CONTENT OPTIONS:
Examples:
{"YES - Include understandable and clear examples." if examples else "NO - Do not any include examples."}
Exercises:
{"YES - Include practical exercises." if exercises else "NO - Do not include exercises."}
Summary:
{"YES - Include detailed a summaries." if summary else "NO - Do not include a summary."}
REQUIREMENTS:
1. Create accurate educational content.
2. Use clear headings and subheadings.
3. Make the explanations appropriate for the student's grade.
4. Explain difficult concepts using simple language.
5. Define important terminology.
6. Use bullet points where useful.
7. Include examples when requested.
8. Include exercises when requested.
9. Include a summary when requested.
10. Do not mention that you are an AI.
11. Do not discuss how the notes were generated.
12. Make the content detailed and useful for studying.
13. Use Markdown formatting.
14. Organize the material logically.
FORMAT:
# {title}
## Introduction
Provide a short introduction to the subject which is understandable and clear.
## Learning Objectives
List the key learning objectives.
Then cover each requested topic.
For every topic use:
## [Topic Name]
### Definition
Give a clear definition.
### Explanation
Explain the topic thoroughly and add some examples.
### Key Points
List the most important information.Highlight them.
### Example
Provide an example if examples are enabled.
### Practice Exercises
Provide exercises if exercises are enabled.
At the end provide:
## Summary
Provide a concise revision summary if summaries are enabled.
## Revision Questions
Provide useful questions for the student to test their understanding of the topic.
"""
        #send th request to groq
        complete=groq_client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role":"system","content":("You are an expert educational study-notes generator")},
                {"role":"user","content":prompt}
            ],
            temperature=0.3,
            max_tokens=15600
        )
        notes=complete.choices[0].message.content
        #convert from json
        return jsonify({
            "success":True,
            "title": title,
            "notes": notes
        }),500
    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({
            "success": False,
            "error": "Failed to generate notes.",
            "details": str(e)
        }),500
#create a function to ensure the backend is running
@app.route("/health")
def health():
    return jsonify({
        "status":"online",
        "message":"Study Buddy running"
    })
if __name__=='__main__':
    app.run(debug=True)