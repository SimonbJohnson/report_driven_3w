import React, { Component } from 'react';
import Loading from './Loading';
import FilterMenu from './report_filter_menu.jsx';
import axios from 'axios';
import './report.css';
/* global hxlBites */

class Intro extends Component {

  render(){
    return (
      <p className="intro" dangerouslySetInnerHTML={{__html: this.props.text}}></p>
    )
  }
}

class Tables extends Component {

  render(){
    return (
      <div className="tables" dangerouslySetInnerHTML={{__html: this.props.tableText}}></div>
    )
  }
}

class Report3w extends Component {

  constructor(props){
    super(props);
    let filters = { who : 'All', what : 'All', where : 'All'};
    this.state = { loading: true, filters: filters, introText: '',tables:['']};
    this.loadConfig(props.configURL);
    this.filterHandler = this.filterHandler.bind(this);
  }

  loadConfig(url){

    let self = this;

    axios
      .get(url)
      .then(function(result) {
        self.setState({config: result.data},function () {
          self.loadHXLData(self.state.config.url,self.state.config.who,self.state.config.what,self.state.config.where);
        });
        
      });
  }

  loadHXLData(url,who,what,where){

    let self = this;
    let filterParams = encodeURIComponent(who+','+what+','+where);
    let hxlURL = 'https://proxy.hxlstandard.org/data.json?filter01=cut&cut-include-tags01='+filterParams+'&force=on&url='+url;
    //let hxlURL = 'https://proxy.hxlstandard.org/data.json?force=on&url='+url;
    axios
      .get(hxlURL)
      .then(function(result) {
        self.setState({hxlData:result.data});
        self.setMenuOptions(self.state.hxlData,self.state.filters);
        self.setState({ loading: false });
        self.getBites(self.state.hxlData,self.state.filters);
      });
  }

  setMenuOptions(data,filters){
    let self = this;
    data[1].forEach(function(d,i){
      if(d===self.state.config.who){
        let whoFilters = Object.assign({}, filters);
        whoFilters.who = 'All';
        let whoOptions = self.getDistinctValuesFromColumn(data,i,whoFilters);
        self.setState({ whoOptions: whoOptions,whoColumn:i});
      }
      if(d===self.state.config.what){
        let whatFilters = Object.assign({}, filters);
        whatFilters.what = 'All';
        let whatOptions = self.getDistinctValuesFromColumn(data,i,whatFilters);
        self.setState({ whatOptions: whatOptions,whatColumn:i});
      }
      if(d===self.state.config.where){
        let whereFilters = Object.assign({}, filters);
        whereFilters.where = 'All';
        let whereOptions = self.getDistinctValuesFromColumn(data,i,whereFilters);
        self.setState({ whereOptions: whereOptions,whereColumn:i});
      }
    });
  }

  filterData(data,filters){
    let self = this;
    let filteredData = data;
    if(filters.who!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whoColumn];
          if(value === filters.who){
            return true
          } else {
            return null;
          }
        } else {
          return true;
        }
      });
    }
    if(filters.what!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whatColumn];
          if(value === filters.what){
            return true
          } else {
            return null;
          }
        } else {
          return true;
        }
      });
    }
    if(filters.where!=='All'){
      filteredData = filteredData.filter(function(d,i){
        if(i>1){
          let value = d[self.state.whereColumn];
          if(value === filters.where){
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

  getDistinctValuesFromColumn(data,columnNum,filters){
    data = this.filterData(data,filters)
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
      let data = this.filterData(this.state.hxlData,this.state.filters);
      this.getBites(data,this.state.filters);
    });
  }

  getBites(data,filters){
    let textBites = hxlBites.data(data).getTextBites();
    let introTexts = textBites.filter(function(bite){
      //if(bite.type==='text' && bite.subtype === 'intro'){
      if(bite.type==='text'){  
        return true
      }
      return false;
    });
    introTexts.sort(function(a,b){
      return b.priority > a.priority;
    });
    let introText = '';
    introTexts.forEach(function(bite){
      introText += bite.bite + ' ';
    });
    let tableBites = hxlBites.getTableBites();
    let tableText = '';
    console.log(tableBites);
    tableBites.forEach(function(bite,i){
      if(i==0){
        tableText = bite.bite;
      }
    });
    this.setState({introText:introText,tables:tableText});
    this.setMenuOptions(this.state.hxlData,filters)
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
          <Intro text={this.state.introText}></Intro>
          <Tables tableText={this.state.tables}></Tables>
        </div>
      );
    }

    return (
      <div>{app}</div>
    );
  }
}

export default Report3w;
