const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

//Get all user using GET
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()
    if (!notes?.length) {
        return res.status(400).json({message: 'No notes found'})
    }

    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))

    res.json(notesWithUser)
})

//Create new user using POST
const createNewNote = asyncHandler(async (req, res) => {
    const { title, text, user } = req.body

    //Confirm data
    if (!title || !text || !user) {
        return res.status(400).json({ message: 'All fields are required'})
    }

    //Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec()
    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title'})
    }

    //Create and store new note
    const note = await Note.create({ user, title, text })
    if(note) {
        res.status(201).json({ message: 'New Note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received'})
    }
})

//Update a user using PATCH
const updateNote = asyncHandler(async (req, res) => {
    const { id, title, text, user, completed } = req.body

    //Confirm data
    if (!id || !title || !user || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required'})
    }

    const note = await note.findById(id).exec()
    if(!note) {
        res.status(400).json({ message: 'Note not found' })
    }

    //Check for duplicates
    const duplicate = await Note.findOne({ title }).lean().exec()

    //Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title'})
    } 

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updateNote = await note.save()
    res.json({message: `${updateNote.title} updated`})
})

//Delete a user using PATCH
const deleteNote = asyncHandler(async (req, res) => {
    const { id } =req.body

    //Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Note ID Required'})
    }

    //Delete note
    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message: 'Note not found'})
    } 

    const result = await note.deleteOne()

    const reply = `Note ${result.title} with ID ${result._id} deleted`
    res.json(reply)
})

module.exports = { getAllNotes, createNewNote, updateNote, deleteNote }