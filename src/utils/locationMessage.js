const generateLocationMessage = (username,URL) => {
  return {
        username,
        URL,
        createdAt: new Date().getTime()
  }
}

module.exports = {
    generateLocationMessage 
}