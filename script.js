document.addEventListener('DOMContentLoaded', () => {
    const topicInput = document.getElementById('topics');
    const addTopicButton = document.getElementById('addTopicButton');
    const topicList = document.getElementById('topiclist');
    const generateButton = document.getElementById('generateButton');
    const loadingMessage = document.getElementById('loading');
    const libraryList = document.getElementById('librarylist');
    const emptyMessage = document.getElementById('emptymessage');

    const getTopics = () => Array.from(topicList.querySelectorAll('.topic-pill')).map((item) => item.dataset.topic);

    const addTopic = (value) => {
        const topic = value.trim();
        if (!topic || getTopics().includes(topic)) return;

        const pill = document.createElement('div');
        pill.className = 'topic-pill';
        pill.dataset.topic = topic;

        const text = document.createElement('span');
        text.textContent = topic;

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '×';
        removeButton.setAttribute('aria-label', `Remove ${topic}`);
        removeButton.addEventListener('click', () => pill.remove());

        pill.appendChild(text);
        pill.appendChild(removeButton);
        topicList.appendChild(pill);
        topicInput.value = '';
    };

    if (addTopicButton && topicInput) {
        addTopicButton.addEventListener('click', () => addTopic(topicInput.value));
        topicInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTopic(topicInput.value);
            }
        });
    }

    if (generateButton) {
        generateButton.addEventListener('click', () => {
            const title = document.getElementById('title')?.value.trim() || 'Untitled Notes';
            const topics = getTopics();
            const noteType = document.getElementById('notetype')?.value || 'Detailed Notes';
            const pages = document.getElementById('pages')?.value || 5;
            const grade = document.getElementById('grade')?.value || 'N/A';
            const includeExamples = document.getElementById('examples')?.checked ?? true;
            const includeExercises = document.getElementById('exercises')?.checked ?? true;
            const includeSummary = document.getElementById('summary')?.checked ?? true;

            if (!topics.length && topicInput && topicInput.value.trim()) {
                addTopic(topicInput.value);
            }

            const finalTopics = getTopics();

            if (!finalTopics.length) {
                loadingMessage.textContent = 'Please add at least one topic before generating notes.';
                return;
            }

            loadingMessage.textContent = 'Generating your notes...';

            const noteData = {
                id: Date.now(),
                title,
                topics: finalTopics,
                noteType,
                pages,
                grade,
                includeExamples,
                includeExercises,
                includeSummary,
                createdAt: new Date().toLocaleString()
            };

            const savedNotes = JSON.parse(localStorage.getItem('studyNotes')) || [];
            savedNotes.push(noteData);
            localStorage.setItem('studyNotes', JSON.stringify(savedNotes));

            setTimeout(() => {
                loadingMessage.textContent = 'Notes generated and saved to your library.';
                const form = document.getElementById('title');
                if (form) form.value = '';
                if (topicInput) topicInput.value = '';
                if (topicList) topicList.innerHTML = '';
                if (document.getElementById('grade')) document.getElementById('grade').value = '';
                if (document.getElementById('pages')) document.getElementById('pages').value = 5;
            }, 800);
        });
    }

    const renderLibrary = () => {
        if (!libraryList) return;

        const notes = JSON.parse(localStorage.getItem('studyNotes')) || [];

        libraryList.innerHTML = '';

        if (!notes.length) {
            emptyMessage.style.display = 'block';
            return;
        }

        emptyMessage.style.display = 'none';

        notes.slice().reverse().forEach((note) => {
            const card = document.createElement('article');
            card.className = 'note-card';

            const header = document.createElement('div');
            header.className = 'note-header';

            const title = document.createElement('h3');
            title.textContent = note.title;

            const badge = document.createElement('span');
            badge.className = 'note-badge';
            badge.textContent = note.noteType;

            header.appendChild(title);
            header.appendChild(badge);

            const summary = document.createElement('p');
            summary.textContent = `Topics: ${note.topics.join(', ')}`;

            const meta = document.createElement('div');
            meta.className = 'note-meta';

            const pages = document.createElement('span');
            pages.textContent = `${note.pages} pages`;

            const grade = document.createElement('span');
            grade.textContent = `Grade ${note.grade}`;

            meta.appendChild(pages);
            meta.appendChild(grade);

            const removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.textContent = 'Delete';
            removeButton.addEventListener('click', () => {
                const remaining = JSON.parse(localStorage.getItem('studyNotes')) || [];
                const updated = remaining.filter((item) => item.id !== note.id);
                localStorage.setItem('studyNotes', JSON.stringify(updated));
                renderLibrary();
            });

            card.appendChild(header);
            card.appendChild(summary);
            card.appendChild(meta);
            card.appendChild(removeButton);
            libraryList.appendChild(card);
        });
    };

    renderLibrary();
});
