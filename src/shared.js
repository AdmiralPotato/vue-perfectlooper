export default{
	templatePad: function(template, n){
		let str = typeof n === 'string' ? n : (n).toString();
		return (template + str).substring(str.length);
	}
};
