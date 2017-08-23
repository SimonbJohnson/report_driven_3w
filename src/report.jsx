import React, { Component } from 'react';
import Loading from './Loading';
import FilterMenu from './report_filter_menu.jsx';
import axios from 'axios';
/* global hxlBites */

class Report3w extends Component {

  constructor(props){
    super(props);
    let filters = { who : 'All', what : 'All', where : 'All'};
    this.state = { loading: true, filters: filters};
    this.loadConfig(props.configURL);
    this.filterHandler = this.filterHandler.bind(this);
  }

  loadConfig(url){

    let self = this;

    axios
      .get(url)
      .then(function(result) {
        self.setState({config: result.data});
        self.loadHXLData(self.state.config.url);
      });
  }

  loadHXLData(url){

    let self = this;

    let hxlURL = 'https://proxy.hxlstandard.org/data.json?url='+url;

    axios
      .get(hxlURL)
      .then(function(result) {
        self.setState({hxlData:result.data});
        self.setMenuOptions(self.state.hxlData);
        self.setState({ loading: false });
      });
  }

  setMenuOptions(data){

    let self = this;
    data[1].forEach(function(d,i){
      if(d===self.state.config.who){
        let whoOptions = self.getDistinctValuesFromColumn(data,i);
        self.setState({ whoOptions: whoOptions,whoColumn:i});
      }
      if(d===self.state.config.what){
        let whatOptions = self.getDistinctValuesFromColumn(data,i);
        self.setState({ whatOptions: whatOptions,whatColumn:i});
      }
      if(d===self.state.config.where){
        let whereOptions = self.getDistinctValuesFromColumn(data,i);
        self.setState({ whereOptions: whereOptions,whereColumn:i});
      }
    });
  }

  filterData(data){

    let self = this;
    let filteredData = data;

    if(self.state.filters.who!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whoColumn];
          if(value === self.state.filters.who){
            return true
          } else {
            return null;
          }
        } else {
          return true;
        }
      });
    }

    if(self.state.filters.what!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whatColumn];
          if(value === self.state.filters.what){
            return true
          } else {
            return null;
          }
        } else {
          return true;
        }
      });
    }

    if(self.state.filters.where!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whereColumn];
          if(value === self.state.filters.where){
            return true
          } else {
            return null;
          }
        } else {
          return true;
        }
      });
    }

    return filteredData;

  }

  getDistinctValuesFromColumn(data,columnNum){
    let column = data.map(function(d,i) { return i>1 ? d[columnNum] : null});
    column = column.filter(function(d){return d != null});
    let unique = column.filter(function(d, i, ar){ return ar.indexOf(d) === i; });
    unique = unique.sort();
    unique = ['All'].concat(unique);
    let options = [];
    unique.forEach(function(d){
      options.push({'text':d,'value':d});
    }); 
    return options;
  }

  filterHandler(event,data){
    let filters = {...this.state.filters};
    if(data.id==="whofilter"){filters.who=data.value};
    if(data.id==="whatfilter"){filters.what=data.value};
    if(data.id==="wherefilter"){filters.where=data.value};
    this.setState({filters}, function () {
      let data = this.filterData(this.state.hxlData);
      this.getBites(data);
    });
  }

  getBites(data){
    hxlBites.data(data).getTextBites();
    //console.log(data);
  }

  render() {

    let app = null;
    if (this.state.loading===true) {
      app = <Loading />;
    } else {
      app = (
        <div>
          <h1>{this.state.config.name}</h1>
          <FilterMenu filterHandler={this.filterHandler} whoOptions={this.state.whoOptions} whatOptions={this.state.whatOptions} whereOptions={this.state.whereOptions}/>
        </div>
      );
    }

    return (
      <div>{app}</div>
    );
  }
}

export default Report3w;
