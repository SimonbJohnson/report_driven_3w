hxlBites.render = function(_id,_bite){
	let _tableToHTML = function(table){
		let html = '<table>';
		table.forEach(function(row,index){
			if(index == 0 ){
				html += '<thead><tr>';
				row.forEach(function(value){
					html+='<th>'+value+'</th>';
				});
			}
			if(index == 1 ){
				html += '</tr></thead><tbody><tr>'
			}
			if(index > 1 ){
				html += '</tr><tr>'
			}
			if(index>0){
				row.forEach(function(value){
					html+='<td>'+value+'</td>';
				});
			}
		});
		html += '</tr></tbody></table>';
		return html;
	}

	if(_bite.type == 'table'){
		if(_id == null){
			return _tableToHTML(_bite.bite);
		} else {
			document.getElementById(_id).insertAdjacentHTML(_tableToHTML(_bite.bite));
		}		
	}
}