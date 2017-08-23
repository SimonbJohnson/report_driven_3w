let hxlBites = {

	_data: [],
	_headers: {},

	data: function(data){
		this._data = data;
		console.log(data);
		return this;
	},

	getTextBites: function(){
		let self = this;
		this._textBites.forEach(function(bite){
			bite.ingredients.forEach(function(ingredient){
				let dataset = hxl.wrap(self._data);
				console.log(ingredient.tags);
				dataset.withColumns([ingredient.tags]).columns.forEach(function (column, index) {
				    console.log("Column " + index + " is " + column.displayTag);
				});
			});
		});
	}
}