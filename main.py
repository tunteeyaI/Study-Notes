from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq
import os

load_dotenv()

# create the flask app
app = Flask(__name__)

# set the password to access the app
app.secret_key = os.getenv("SECRET_KEY", "app secret key")

GROQAPIKEY = os.getenv("GROQAPIKEY")
if not GROQAPIKEY:
    print("GROQ API KEY NOT FOUND!")

# groq model

groqmodel = Groq(api_key=GROQAPIKEY) if GROQAPIKEY else None
MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
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
@app.route("/generate", methods=["POST"])
def generate_notes():
    try: #to get the data from the form
        data=request.get_json()
        if not isinstance(data, dict):
            return jsonify({"success":False,"error":"No data was fetched."}),400
        #fetch the data
        title=str(data.get("title", "")).strip()
        topics=data.get("topics",[])
        note_type_instructions = {
            "Detailed Notes": "Explain each concept thoroughly, with clear organization and useful detail.",
            "Exam Tips and Quizzes": "Prioritize exam strategies, common mistakes, and quiz questions with answers.",
            "Essay Format": "Present the material as a coherent educational essay with clear section headings.",
            "Beginner Friendly": "Assume the learner is new to the subject and explain prerequisite ideas simply.",
            "Quick Revision": "Prioritize concise definitions, facts, formulas, and rapid-revision points.",
        }
        notetype=data.get("note_type", "Detailed Notes")
        if not isinstance(notetype, str) or notetype not in note_type_instructions:
            return jsonify({"success": False, "error": "Please choose a valid note type."}), 400
        try:
            pages = int(data.get("pages", 3))
        except (TypeError, ValueError):
            return jsonify({"success": False, "error": "Page count must be a whole number."}), 400
        if not 1 <= pages <= 20:
            return jsonify({"success": False, "error": "Choose between 1 and 20 pages."}), 400
        grade=str(data.get("grade", "")).strip()
        examples=data.get("examples", True) is True
        exercises=data.get("exercises", True) is True
        summary=data.get("summary", True) is True
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
        # converting the topics into text
        if isinstance(topics, list):
            topic_text = ", ".join(str(topic).strip() for topic in topics if str(topic).strip())
        else:
            topic_text = str(topics).strip()

        notebook_title = title

        if not topic_text:
            return jsonify({
                "success": False,
                "error": "Please enter at least one topic"
            }), 400

        prompt = f"""
You are an expert educational notes creator.
Create a complete study notebook for a student.
NOTEBOOK TITLE:
{notebook_title}
TOPICS:
{topic_text}
NOTE TYPE:
{notetype}
NUMBER OF PAGES:
Approximately {pages} pages
GRADE:
{grade if grade else "General student level"}
NOTE STYLE:
{note_type_instructions[notetype]}
CONTENT OPTIONS:
Examples: {"Include clear examples." if examples else "Do not include examples."}
Exercises: {"Include practice exercises and revision questions." if exercises else "Do not include exercises or revision questions."}
Summary: {"Include a concise summary." if summary else "Do not include a summary."}
REQUIREMENTS:
1. Create accurate educational content.
2. Use clear headings and subheadings.
3. Make the explanations appropriate for the student's grade.
4. Explain difficult concepts using simple language.
5. Define important terminology.
6. Use bullet points where useful.
7. Follow the selected note style and content options exactly.
8. Do not add sections that were explicitly disabled.
9. Do not mention that you are an AI or discuss how the notes were generated.
10. Use Markdown and organize the material logically.
SUGGESTED STRUCTURE:
# {notebook_title}
## Introduction
Provide a short introduction to the subject which is understandable and clear.
## Learning Objectives
List the key learning objectives.
Then cover each requested topic.
For each topic, include:
## [Topic Name]
### Definition
Give a clear definition.
### Explanation
Explain the topic according to the selected note style.
### Key Points
List the most important information. Highlight them.
{"### Examples\nProvide useful examples." if examples else ""}
{"### Practice Exercises\nProvide practice exercises and revision questions." if exercises else ""}
At the end:
{"## Summary\nProvide a concise revision summary." if summary else ""}
"""
        if groqmodel is None:
            return jsonify({
                "success": False,
                "error": "Groq API key is missing. Add GROQAPIKEY to your environment variables."
            }), 500

        # send the request to Groq
        complete = groqmodel.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": "You are an expert educational study-notes generator"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=15600
        )

        if not complete or not getattr(complete, "choices", None):
            return jsonify({
                "success": False,
                "error": "No response received from the notes generator."
            }), 500

        notes = complete.choices[0].message.content
        if not isinstance(notes, str) or not notes.strip():
            return jsonify({
                "success": False,
                "error": "The notes generator returned an empty response. Please try again."
            }), 502

        # convert from json
        return jsonify({
            "success": True,
            "title": notebook_title,
            "notes": notes
        }), 200
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