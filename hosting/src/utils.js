
function formatDateYMDHMS (date) {
  if (date) {
    date = date.getFullYear() + '/' + lpad(date.getMonth() + 1, 2) + '/' + lpad(date.getDate(), 2) +
      ' ' + lpad(date.getHours(), 2) + ':' + lpad(date.getMinutes(), 2) + ':' + lpad(date.getSeconds(), 2) + '.' + lpad(date.getMilliseconds(), 3)
  }
  return date
}

function lpad (value, width) {
  return (value.toString().length > width) ? value : (new Array(width).join('0') + value).slice(-width)
}

module.exports = {
  formatDateYMDHMS,
  lpad
}
