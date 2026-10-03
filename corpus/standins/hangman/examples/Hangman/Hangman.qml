// Stands in for HangmanGame (hangmangame.cpp), the game every view binds to:
// a word of dict.txt, the letters asked for, and the score, which is kept.
import QtQml
import QtCore

QtObject {
    id: game

    // The game's own to set: in C++ nothing else can.
    property string word
    property string lettersOwned
    readonly property string vowels: "AEIOU"
    readonly property string consonants: "BCDFGHJKLMNPQRSTVWXYZ"
    readonly property int errorCount: errors(lettersOwned, word)
    property bool vowelsUnlocked: false
    property int vowelsAvailable: 0
    property int wordsGiven: 0
    property int wordsGuessedCorrectly: 0
    property int score: 0

    signal vowelBought(string vowel)
    signal purchaseWasSuccessful(bool wasSuccessful)

    onVowelBought: (vowel) => registerLetterBought(vowel)

    function reset() {
        lettersOwned = ""
        chooseRandomWord()
    }

    function reveal() {
        lettersOwned += vowels + consonants
    }

    function gameOverReveal() {
        lettersOwned += vowels + consonants
    }

    function requestLetter(letterString) {
        registerLetterBought(letterString.charAt(0))
    }

    function guessWord(word) {
        if (word.toUpperCase() === game.word.toUpperCase()) {
            // A vowel for each one not asked for, and a point for each such
            // consonant and each error not made.
            const vowelsEarned = unasked(vowels)
            const pointsEarned = unasked(consonants) + 8 - errors(lettersOwned, game.word)
            vowelsAvailable += vowelsEarned
            score += pointsEarned
            lettersOwned += game.word.toUpperCase()
        } else {
            // A digit is in no word: a wrong guess is an error more.
            lettersOwned += String(wrongGuesses++)
        }
    }

    function isVowel(letter) {
        return vowels.includes(letter.charAt(0))
    }

    function setVowelsAvailable(count) {
        vowelsAvailable = count
    }

    function setWordsGiven(count) {
        wordsGiven = count
    }

    function setWordsGuessedCorrectly(count) {
        wordsGuessedCorrectly = count
    }

    function setScore(score) {
        game.score = score
    }

    // The rest is private in C++.
    property var wordList: []
    property int wrongGuesses: 0

    function registerLetterBought(letter) {
        if (!lettersOwned.includes(letter))
            lettersOwned += letter
    }

    // How many of the letters asked for the word has not.
    function errors(lettersOwned, word) {
        let count = 0
        for (const letter of lettersOwned) {
            if (!word.includes(letter))
                ++count
        }
        return count
    }

    // How many of the word's letters are among `letters` and not owned.
    function unasked(letters) {
        let total = 0
        for (const letter of word) {
            if (letters.includes(letter) && !lettersOwned.includes(letter))
                ++total
        }
        return total
    }

    function chooseRandomWord() {
        if (wordList.length === 0)
            return
        // Another word than the one there is, so that the word changes: in
        // C++ the same again is a new word to guess as well, one time in as
        // many as there are words.
        const others = wordList.filter((entry) => entry !== word)
        if (others.length > 0)
            word = others[Math.floor(Math.random() * others.length)]
        else
            wordChanged()
    }

    // The words are a resource of the program: here a file of the example,
    // read while the views are made, as the C++ reads it in a thread.
    function initWordList() {
        const request = new XMLHttpRequest()
        request.onreadystatechange = () => {
            if (request.readyState !== XMLHttpRequest.DONE)
                return
            wordList = request.responseText.split("\n")
                .map((line) => line.trim().toUpperCase())
                .filter((line) => line.length > 0 && line.length < 10)
            chooseRandomWord()
        }
        request.open("GET", Qt.resolvedUrl("../../../../qtdoc/examples/demos/hangman/dict.txt"))
        request.send()
    }

    // What is kept from one run to the next, read when the game is made and
    // written when it changes.
    readonly property Settings persistentSettings: Settings {
        category: "Hangman"
    }
    onVowelsUnlockedChanged: persistentSettings.setValue("vowelsUnlocked", vowelsUnlocked)
    onVowelsAvailableChanged: persistentSettings.setValue("vowelsAvailable", vowelsAvailable)
    onWordsGivenChanged: persistentSettings.setValue("wordsGiven", wordsGiven)
    onWordsGuessedCorrectlyChanged: persistentSettings.setValue("wordsGuessedCorrectly", wordsGuessedCorrectly)
    onScoreChanged: persistentSettings.setValue("score", score)

    Component.onCompleted: {
        // What is kept is kept as text.
        vowelsUnlocked = String(persistentSettings.value("vowelsUnlocked", false)) === "true"
        vowelsAvailable = Number(persistentSettings.value("vowelsAvailable", 0))
        wordsGiven = Number(persistentSettings.value("wordsGiven", 0))
        wordsGuessedCorrectly = Number(persistentSettings.value("wordsGuessedCorrectly", 0))
        score = Number(persistentSettings.value("score", 0))
        initWordList()
    }
}
