
document.addEventListener("DOMContentLoaded", () => {
    const topicInput = document.getElementById("topics");
    const topicList = document.getElementById("topiclist");
    const addTopicButton = document.getElementById("addTopicButton");
    const generateButton = document.getElementById("generateButton");
    const loadingMessage = document.getElementById("loading");
    const notesModal = document.getElementById("notesModal");
    const generatedTitle = document.getElementById("generatedTitle");
    const generatedNotes = document.getElementById("generatedNotes");
    const closeNotesModal = document.getElementById("closeNotesModal");
    const libraryList = document.getElementById("librarylist");
    const emptyMessage = document.getElementById("emptymessage");
    const noteDialog = document.getElementById("noteDialog");
    const noteDialogTitle = document.getElementById("noteDialogTitle");
    const noteContent = document.getElementById("noteContent");
    function getSavedNotes() {
        try {
            const savedNotes = JSON.parse(localStorage.getItem("studyNotes") || "[]");
            return Array.isArray(savedNotes) ? savedNotes : [];
        } catch (error) {
            console.error("Could not read saved notes:", error);
            return [];
        }
    }
    function saveNotes(notes) {
        try {
            localStorage.setItem("studyNotes", JSON.stringify(notes));
            return true;
        } catch (error) {
            console.error("Could not save notes:", error);
            return false;
        }
    }
    function escapeHtml(value) {
        return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function formatInlineMarkdown(text) {
        return text.replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>");
    }
    function renderMarkdown(markdown) {
        const source = String(markdown || "");
        if (window.marked && typeof window.marked.parse === "function" && window.DOMPurify && typeof window.DOMPurify.sanitize === "function") {
            return window.DOMPurify.sanitize(window.marked.parse(source));
        }
        const lines = escapeHtml(source).split(/\r?\n/);
        const html = [];
        let listType = "";
        function closeList() {
            if (listType) {
                html.push(`</${listType}>`);
                listType = "";
            }
        }
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) {
                closeList();
                continue;
            }
            const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (heading) {
                closeList();
                const level = heading[1].length;
                html.push(`<h${level}>${formatInlineMarkdown(heading[2])}</h${level}>`);
                continue;
            }
            const unordered = trimmed.match(/^[-*+]\s+(.+)$/);
            const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
            if (unordered || ordered) {
                const newListType = unordered ? "ul" : "ol";
                if (listType !== newListType) {
                    closeList();
                    listType = newListType;
                    html.push(`<${listType}>`);
                }
                html.push(`<li>${formatInlineMarkdown((unordered || ordered)[1])}</li>`);
                continue;
            }
            closeList();
            html.push(`<p>${formatInlineMarkdown(trimmed)}</p>`);
        }
        closeList();
        return html.join("");
    }
    function showFormattedNotes(target, content) {
        if (target) {
            target.innerHTML = renderMarkdown(content);
        }
    }
    function addTopic() {
        if (!topicInput || !topicList) {
            return;
        }
        const topic = topicInput.value.trim();
        if (!topic) {
            return;
        }
        const existingTopics = getTopics();
        if (existingTopics.some((item) => item.toLowerCase() === topic.toLowerCase())) {
            topicInput.value = "";
            topicInput.focus();
            return;
        }
        const topicPill = document.createElement("div");
        topicPill.classList.add("topic-pill");
        topicPill.dataset.topic = topic;
        const topicLabel = document.createElement("span");
        topicLabel.textContent = topic;
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.classList.add("remove-topic");
        removeButton.setAttribute("aria-label", `Remove ${topic}`);
        removeButton.textContent = "x";
        topicPill.append(topicLabel, removeButton);
        topicList.appendChild(topicPill);
        topicInput.value = "";
        topicInput.focus();
    }
    function getTopics() {
        if (!topicList) {
            return [];
        }
        return Array.from(topicList.querySelectorAll(".topic-pill")).map((item) => item.dataset.topic);
    }
    if (addTopicButton) {
        addTopicButton.addEventListener("click", addTopic);
    }
    if (topicInput) {
        topicInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                addTopic();
            }
        });
    }
    if (topicList) {
        topicList.addEventListener("click", (event) => {
            const removeButton = event.target.closest(".remove-topic");
            if (removeButton) {
                const topicPill = removeButton.closest(".topic-pill");
                if (topicPill) {
                    topicPill.remove();
                }
            }
        });
    }
    function closeGeneratedNotes() {
        if (notesModal) {
            notesModal.hidden = true;
        }
    }
    if (closeNotesModal) {
        closeNotesModal.addEventListener("click", closeGeneratedNotes);
    }
    if (notesModal) {
        notesModal.addEventListener("click", (event) => {
            if (event.target === notesModal) {
                closeGeneratedNotes();
            }
        });
    }
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && notesModal && !notesModal.hidden) {
            closeGeneratedNotes();
        }
    });
    if (generateButton) {
        generateButton.addEventListener("click", async () => {
            const title = document.getElementById("title")?.value.trim() || "";
            const noteType = document.getElementById("notetype")?.value || "Detailed Notes";
            const pages = Number(document.getElementById("pages")?.value || 5);
            const grade = document.getElementById("grade")?.value.trim() || "";
            const includeExamples = document.getElementById("examples")?.checked ?? true;
            const includeExercises = document.getElementById("exercises")?.checked ?? true;
            const includeSummary = document.getElementById("summary")?.checked ?? true;
            if (topicInput && topicInput.value.trim()) {
                addTopic();
            }
            const topics = getTopics();
            if (!title) {
                alert("Please enter a note title.");
                return;
            }
            if (topics.length === 0) {
                alert("Please add at least one topic.");
                return;
            }
            if (!Number.isInteger(pages) || pages < 1 || pages > 20) {
                alert("Please choose between 1 and 20 pages.");
                return;
            }
            const noteData = {
                title: title,
                topics: topics,
                note_type: noteType,
                pages: pages,
                grade: grade,
                examples: includeExamples,
                exercises: includeExercises,
                summary: includeSummary
            };
            generateButton.disabled = true;
            if (loadingMessage) {
                loadingMessage.style.display = "block";
                loadingMessage.textContent = "Generating your notes...";
            }
            try {
                const response = await fetch("/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(noteData)
                });
                const data = await response.json().catch(() => ({}));
                if (!response.ok || !data.success) {
                    throw new Error(data.error || "Something went wrong while generating the notes.");
                }
                const noteTitle = data.title || title;
                const noteText = String(data.notes || "");
                if (!noteText.trim()) {
                    throw new Error("The notes generator returned empty notes. Please try again.");
                }
                const savedNote = {
                    id: Date.now(),
                    title: noteTitle,
                    notes: noteText,
                    topics: topics,
                    noteType: noteType,
                    pages: pages,
                    grade: grade,
                    includeExamples: includeExamples,
                    includeExercises: includeExercises,
                    includeSummary: includeSummary,
                    createdAt: new Date().toLocaleString()
                };
                const savedNotes = getSavedNotes();
                savedNotes.push(savedNote);
                const savedSuccessfully = saveNotes(savedNotes);
                if (generatedTitle) {
                    generatedTitle.textContent = noteTitle;
                }
                showFormattedNotes(generatedNotes, noteText);
                if (notesModal) {
                    notesModal.hidden = false;
                } else {
                    alert("Notes were generated, but the notes popup was not found in studio.html.");
                }
                if (loadingMessage) {
                    loadingMessage.textContent = savedSuccessfully ? "Notes generated and saved to your library." : "Notes generated, but could not be saved to your library.";
                }
            } catch (error) {
                console.error("Generation error:", error);
                if (loadingMessage) {
                    loadingMessage.textContent = "Failed to generate notes.";
                }
                alert("Failed to generate notes.\n\n" + error.message);
            } finally {
                generateButton.disabled = false;
            }
        });
    }
    if (libraryList) {
        const savedNotes = getSavedNotes();
        if (savedNotes.length === 0) {
            if (emptyMessage) {
                emptyMessage.style.display = "block";
            }
        } else {
            if (emptyMessage) {
                emptyMessage.style.display = "none";
            }
            savedNotes.forEach((note) => {
                const noteCard = document.createElement("div");
                noteCard.classList.add("note-card");
                const title = document.createElement("h3");
                title.textContent = note.title || "Untitled notes";
                const topics = document.createElement("p");
                topics.textContent = `Topics: ${(Array.isArray(note.topics) ? note.topics : []).join(", ")}`;
                const created = document.createElement("p");
                created.textContent = `Created: ${note.createdAt || "Unknown"}`;
                const viewButton = document.createElement("button");
                viewButton.type = "button";
                viewButton.classList.add("view-note");
                viewButton.dataset.id = String(note.id);
                viewButton.textContent = "View Notes";
                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.classList.add("delete-note");
                deleteButton.dataset.id = String(note.id);
                deleteButton.textContent = "Delete";
                noteCard.append(title, topics, created, viewButton, deleteButton);
                libraryList.appendChild(noteCard);
            });
        }
    }
    if (libraryList) {
        libraryList.addEventListener("click", (event) => {
            const button = event.target.closest("button");
            if (!button) {
                return;
            }
            const noteId = Number(button.dataset.id);
            const savedNotes = getSavedNotes();
            if (button.classList.contains("view-note")) {
                const note = savedNotes.find((item) => Number(item.id) === noteId);
                if (note && noteDialog && noteDialogTitle && noteContent) {
                    noteDialogTitle.textContent = note.title || "Study Notes";
                    showFormattedNotes(noteContent, note.notes || "No note content was saved.");
                    if (typeof noteDialog.showModal === "function") {
                        noteDialog.showModal();
                    } else {
                        alert("The notes dialog is missing the required dialog element.");
                    }
                }
            }
            if (button.classList.contains("delete-note")) {
                const confirmed = confirm("Are you sure you want to delete these notes?");
                if (!confirmed) {
                    return;
                }
                const updatedNotes = savedNotes.filter((item) => Number(item.id) !== noteId);
                if (saveNotes(updatedNotes)) {
                    location.reload();
                } else {
                    alert("Could not delete the notes. Please try again.");
                }
            }
        });
    }
});
