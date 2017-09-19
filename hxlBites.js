let hxlBites = {

	_data: [],
	_headers: {},

	data: function(data){
		this._data = data;
		return this;
	},

	getTextBites: function(){
		let self = this;
		let bites = [];
		this._textBites.forEach(function(bite,i){
			let distinctOptions = {};
			bite.ingredients.forEach(function(ingredient){
				distinctValues = self._getIngredientValues(ingredient,self._data);
				distinctOptions[ingredient.name] = distinctValues;
			});
			let matchingValues = self._checkCriteria(bite.criteria,distinctOptions);
			if(matchingValues !== false){
				let variables = self._getVariables(bite,matchingValues);
				let newBite = self._generateTextBite(bite.phrase,variables);
				bites.push({'type':'text','subtype':bite.subType,'priority':bite.priority,'bite':newBite, 'id':bite.id});
			}
		});
		return bites;
	},

	getTableBites: function(){
		let self = this;
		let bites = [];
		this._tableBites.forEach(function(bite,i){
			let distinctOptions = {};
			bite.ingredients.forEach(function(ingredient){
				distinctValues = self._getIngredientValues(ingredient,self._data);
				distinctOptions[ingredient.name] = distinctValues;
			});
			let matchingValues = self._checkCriteria(bite.criteria,distinctOptions);
			if(matchingValues !== false){
				let variables = self._getTableVariables(self._data,bite,matchingValues);
				let newBite = self._generateTableBite(bite.table,variables);
				bites.push({'type':'table','subtype':bite.subType,'priority':bite.priority,'bite':newBite, 'id':bite.id});
			}			
		});
		return bites;
	},

	getChartBites: function(){
		let self = this;
		let bites = [];
		this._chartBites.forEach(function(bite,i){
			let distinctOptions = {};
			bite.ingredients.forEach(function(ingredient){
				distinctValues = self._getIngredientValues(ingredient,self._data);
				distinctOptions[ingredient.name] = distinctValues;
			});
			let matchingValues = self._checkCriteria(bite.criteria,distinctOptions);
			if(matchingValues !== false){
				let variables = self._getTableVariables(self._data,bite,matchingValues);
				let newBite = self._generateChartBite(bite.chart,variables);
				bites.push({'type':'chart','subtype':bite.subType,'priority':bite.priority,'bite':newBite, 'id':bite.id});
			}			
		});
		return bites;
	},

	getMapBites: function(){
		let self = this;
		let bites = [];
		this._mapBites.forEach(function(bite,i){
			let distinctOptions = {};
			bite.ingredients.forEach(function(ingredient){
				distinctValues = self._getIngredientValues(ingredient,self._data);
				distinctOptions[ingredient.name] = distinctValues;
			});
			let matchingValues = self._checkCriteria(bite.criteria,distinctOptions);
			if(matchingValues !== false){
				let tag = bite.ingredients[0].tags[0];
				let location = null;
				let level = 0;
				if(tag=='#country+code'){
					location = 'world';
				}
				if(location!=null){
					let keyVariable = bite.variables[0]
					let values = matchingValues[keyVariable][0].values;
					let mapCheck = self._checkMapCodes(location,level,values);
					if(mapCheck.percent>0.5){
						let variables = self._getTableVariables(self._data,bite,matchingValues);
						let newBite = self._generateMapBite(bite.map,variables,location,level);
						bites.push({'type':'map','subtype':bite.subType,'priority':bite.priority,'bite':newBite, 'id':bite.id, 'geom_url':mapCheck.url,'geom_attribute':mapCheck.code});
					}
				}
			}		
		});
		console.log(bites);
		return bites;
	},		

	_getIngredientValues: function(ingredient,data){
		let ingredientDistinct = [];
		let dataset = hxl.wrap(data);
		dataset.withColumns(ingredient.tags).forEach(function(row,col,rowindex){				
			row.values.forEach(function(value,index){
				//At the moment only include first tag that meets requirement.
				if(index==0){
					if(rowindex==0){
						ingredientDistinct[index] = {'tag':'','header':'','uniqueValues':[],'values':[],'col':''};
						ingredientDistinct[index].tag = col.displayTags[index];
						ingredientDistinct[index].header = col.headers[index];
						ingredientDistinct[index].col = data[0].indexOf(ingredientDistinct[index].header);
					}
					if(ingredientDistinct[index].uniqueValues.indexOf(value)==-1){
						ingredientDistinct[index].uniqueValues.push(value);
					}
					ingredientDistinct[index].values.push(value);
				}						
			});
		});
		return ingredientDistinct;
	},

	_checkCriteria: function(criteria,ingredientValues){
		let self = this;
		criteria.forEach(function(criterion){
			parsedCriterion = self._parseCriterion(criterion);
			ingredientValues = self._filterForMatches(parsedCriterion,ingredientValues);
		});
		for(key in ingredientValues){
			if(ingredientValues[key].length==0){
				return false;
			}
		}		
		return ingredientValues;
	},

	_parseCriterion: function(criterion){
		let operations = ['<','>'];
		let operation = -1;
		operations.forEach(function(op){
			if(criterion.indexOf(op)>-1){
				operation = op;
			}
		});
		if(operation != -1){
			let parse = criterion.split(operation);
			let variable = parse[0].trim();
			let value = parse[1].trim();
			return {'variable':variable,'operation':operation,'value':value};			
		} else {
			return 'Failed to parse';
		}
	},

	_filterForMatches: function(criterion,ingredientValues){
		ingredientValues[criterion.variable] = ingredientValues[criterion.variable].filter(function(distinctValues,i){
			if(criterion.operation=='<'){
				if(!(distinctValues.uniqueValues.length < criterion.value)){
					return false;
				}
			}
			if(criterion.operation=='>'){
				if(!(distinctValues.uniqueValues.length > criterion.value)){
					return false;
				}		
			}
			return true;
		});
		return ingredientValues;
	},

	_getTableVariables: function(data,bite,matchingValues){

		//needs large efficieny improvements
		let self = this;
		let table = [];
		let keyMatch = matchingValues[bite.variables[0]][0];
		let keyValues = this._varFuncKeyValue(keyMatch);
		let firstCol = [keyMatch.header];
		keyValues.forEach(function(keyValue){
			firstCol.push(keyValue.key); 
		});
		table.push(firstCol);
		bite.variables.forEach(function(variable,index){
			if(index>0){
				let col = new Array(firstCol.length).fill(0);
				if(variable.indexOf('(')>-1){
					let func = variable.split('(')[0];
					if(func == 'count'){
						col[0] = 'Count';
						keyValues.forEach(function(keyValue,index){
							col[index+1] = keyValue.value;
						});
					}
				} else {
					let match = matchingValues[variable][0];
					col[0] = match.header;
					firstCol.forEach(function(value,index){
						if(index>0){
							let filteredData = self._filterData(data,keyMatch.col,value);
							let uniques = [];
							filteredData.forEach(function(row,index){
								let value = row[match.col];
								if(uniques.indexOf(value)==-1){
									uniques.push(value);
								}
							});
							col[index] = uniques.length;
						}
					});
				}
				table.push(col);
			}
		});
		return table;
	},

	_filterData(data,col,value){
		let filterData = data.filter(function(d,index){
			if(d[col]==value){
				return true;
			} else {
				return false;
			}
		});
		return filterData;
	},

	_getVariables: function(bite,matchingValues){

		let self = this;
		
		variableList = [];
		bite.variables.forEach(function(variable){
			let func = variable.split('(')[0];
			let ingredient = variable.split(')')[0].split('(')[1];
			let items=[];
			matchingValues[ingredient].forEach(function(match){
				if(func == 'count'){
					items.push(self._varFuncCount(match));
				}
				if(func == 'single'){
					items.push(self._varFuncSingle(match));
				}
				if(func == 'header'){
					items.push(self._varFuncHeader(match));
				}
				if(func == 'tag'){
					items.push(self._varFuncTag(match));
				}
				if(func == 'list'){
					items.push(self._varFuncList(match));
				}
				if(func == 'listOrCount'){
					items.push(self._varFuncListOrCount(match));
				}
				if(func == 'first'){
					items.push(self._varFuncSortPosition(match,0));
				}
				if(func == 'firstCount'){
					items.push(self._varFuncSortPositionCount(match,0));
				}
				if(func == 'second'){
					items.push(self._varFuncSortPosition(match,1));
				}
				if(func == 'secondCount'){
					items.push(self._varFuncSortPositionCount(match,1));
				}				
			});
			variableList.push(items);
		});
		return variableList;
	},

	_checkMapCodes: function(location,level,values){
		let maxMatch = 0;
		let maxCode = 0;
		let name = location+'_'+level;
		let maxValues = [];
		hxlBites._mapValues[name].codes.forEach(function(code){
			let match = 0;
			values.forEach(function(value,i){
				if(code.values.indexOf(value)>-1){
					match++;
				}
			});
			if(match>maxMatch){
				maxMatch=match;
				maxCode = code.name;
			}
		});
		let matchPercent = maxMatch/values.length;
		let unmatched = values.length - maxMatch;
		let url = this._getGeomURL(name);
		return {'unmatched':unmatched,'percent':matchPercent,'code':maxCode,'url':url};
	},

	_getGeomURL(name){
		url = {};
		url['world_0'] = 'world.json';
		return url[name];
	},

	//change later to form every iteration
	_generateTextBite: function(phrase,variables){
		phrase = phrase.split('{');
		phrase = phrase.map(function(part,i){
			if(i>0){
				let numString = part.substring(0,1);;
				let varNum = parseInt(numString);
				let matchString = numString + '}';
				part = part.replace(numString+'}',variables[varNum-1][0]);
			}
			return part;
		});
		let bite  = '';
		phrase.forEach(function(part){
			bite += part;
		});
		return bite;
	},

	_generateTableBite: function(table,variables){
		let tableData = this._transposeTable(variables);
		if(table.length>0){
			let func=table.split('(')[0];
			if(func=='rows'){
				let value = parseInt(table.split('(')[1].split(')')[0]);
				tableData = tableData.filter(function(row,i){
					if(i<value+1){
						return true;
					} else {
						return false;
					}
				}) ;
			}
		}
		let bite = tableData;
		return bite;
	},

	_generateChartBite: function(chart,variables){
		let chartData = this._transposeTable(variables);
		if(chart.length>0){
			let func=chart.split('(')[0];
			if(func=='rows'){
				let value = parseInt(chart.split('(')[1].split(')')[0]);
				chartData = chartData.filter(function(row,i){
					if(i<value+1){
						return true;
					} else {
						return false;
					}
				}) ;
			}
		}
		let bite = chartData;
		return bite;
	},


	//use better way to get tags that does not grab first tag.
	_generateMapBite: function(map,variables,location,level){
		let mapData = this._transposeTable(variables);
		let bite = mapData;
		return bite;
	},

	_transposeTable: function(table){

		let newTable = [];
		let length = table[0].length;
		for(var i =0;i<table[0].length;i++){
			let row = [];
			table.forEach(function(col){
				row.push(col[i]);
			});
			newTable.push(row);
		}
		return newTable;
	},

	_varFuncCount: function(match){
		return '<span class="hbvalue">'+match.uniqueValues.length+'</span>';
	},

	_varFuncSingle: function(match){
		return '<span class="hbvalue">'+match.uniqueValues[0]+'</span>';
	},

	_varFuncHeader: function(match){
		return '<span class="hbheader">' + match.header + '</span>';
	},

	_varFuncTag: function(match){
		return '<span class="hbtag">' + match.tag + '</span>';
	},

	_varFuncKeyValue: function(match){
		let hash = {};
		match.values.forEach(function(value){
			if(value in hash){
				hash[value]++;
			} else {
				hash[value] = 1;
			}
		});
		let output = [];
		for(key in hash){
			output.push({'key':key,'value':hash[key]});
		}
		output = output.sort(function(a,b){
			return b.value - a.value;
		});
		return output;
	},

	_varFuncSortPosition: function(match,position){
		let keyValue = this._varFuncKeyValue(match);
		let key = keyValue[position].key;
		return '<span class="hbvalue">' + key + '</span>';
	},

	_varFuncSortPositionCount: function(match,position){
		let keyValue = this._varFuncKeyValue(match);
		let value = keyValue[position].value;
		return '<span class="hbvalue">' + value + '</span>';
	},

	_varFuncList: function(match){
		let output = '';
		match.uniqueValues.forEach(function(v,i){
			if(i==0){
				output = '<span class="hbvalue">'+v+'</span>';
			} else if(i<match.uniqueValues.length-1) {
				output+= ', <span class="hbvalue">'+v+'</span>';
			} else {
				output+= ' and <span class="hbvalue">'+v+'</span>';
			}
		});
		return output;
	},

	_varFuncListOrCount: function(match){
		if(match.uniqueValues.length>4){
			return this._varFuncCount(match) + ' ' + this._varFuncHeader(match)+'(s)';
		} else {
			return this._varFuncList(match);
		}
	}
}