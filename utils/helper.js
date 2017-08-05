module.exports = {
  getRandomElementFromArray: function(arr) {
    if(!arr || !arr.length) {
      return;
    }
    if(arr.length === 1) {
      return arr[0];
    }
    let min = 0,
      max = arr.length;

    return arr[getRandomNumber(0, arr.length-1)];
  },
  getRandomNumber: function(start, end) {
    return Math.floor(Math.random() * ( end-start+1 ) + start);
  }
}