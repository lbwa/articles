module.exports =  function (day) {
  const year = day.getFullYear()
  const month = day.getMonth() + 1
  const date = day.getDate()

  return `${year}-${month}-${date}`
}
