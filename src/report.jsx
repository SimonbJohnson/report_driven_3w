import React, { Component } from 'react';
import Loading from './Loading';
import FilterMenu from './report_filter_menu.jsx';
import axios from 'axios';
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell} from 'recharts';
import SimpleMap from './simple-map.jsx'
import * as topojson from 'topojson';
import './report.css';
/* global hxlBites */

class Intro extends Component {

  render(){
    return (
      <p className="intro" dangerouslySetInnerHTML={{__html: this.props.text}}></p>
    )
  }
}

class GraphicalBites extends Component {

  render(){

    let bites = [];

    this.props.chartBites.forEach(function(chart,i){
      let key = 'chart'+i
      if(chart.subtype==='pie'){
        bites.push(<Pie3WChart key={key} data={chart.bite} />);
      } else {
        bites.push(<Row3WChart key={key} data={chart.bite} />);
      }
    });

    this.props.mapBites.forEach(function(map,i){
      let key = 'map'+i
      let codes = map.bite.map(function(d,i){
        return d[0];
      });
      bites.push(<MapBite key={key} url={map.geom_url} codes={codes} attribute={map.geom_attribute} />);
    });    

    return (
      <div>{bites}<div className="tables" dangerouslySetInnerHTML={{__html: this.props.tableText}}></div></div>
    )
  }
}

class MapBite extends Component {

  constructor(props){
      super(props)
      this.state = { loading: true, geom: null};
      this.loadGeom(this.props.url);
  }

  loadGeom(url){
    console.log(url);
    let self = this;

    axios
      .get(url)
      .then(function(result) {
        console.log(result.data);
        let geom = topojson.feature(result.data,result.data.objects.geom);
        self.setState({geom: geom, loading: false});
      });
  }

  render(){

    let comp = null;
    if(this.state.loading){
      comp = <h1>Loading Map</h1>;
    } else {
      comp = <SimpleMap width="350" height="400" geom={this.state.geom} color="#ff0000" codes={this.props.codes} attribute={this.props.attribute} />;
    }
    return (
      <div className="mapbite">{comp}</div>
    )
  }
}

class Pie3WChart extends Component {

  render(){

    let colors = ['#EF5350','#FFAB00','#43A047','#90CAF9'];

    return (
      <PieChart width={350} height={400} isAnimationActive={false}>
        <Pie data={this.props.data} cx="50%" cy="50%" outerRadius={100} label={({name, value})=>`${name}: ${value}`} dataKey="value" labelLine={false} isAnimationActive={false}>
          {
            this.props.data.map((d, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))
          }
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    )
  }
}

class Row3WChart extends Component {

  render () {

    let color = '#EF5350';

    return (
      <BarChart width={350} height={400} data={this.props.data}
            margin={{top: 5, right: 20, left: 50, bottom: 5}} layout='vertical'>
       <XAxis type="number" allowDecimals={false} />
       <YAxis type="category" dataKey="name" />
       <CartesianGrid strokeDasharray="3 3" />
       <Tooltip />
       <Legend />
       <Bar dataKey="value" fill={color} isAnimationActive={false} />
      </BarChart>
    );
  }
}

class Report3w extends Component {

  constructor(props){
    super(props);
    let filters = { who : 'All', what : 'All', where : 'All'};
    this.state = { loading: true, filters: filters, introText: '',tables:[''],charts:[],maps:[]};
    this.loadConfig(props.configURL);
    this.filterHandler = this.filterHandler.bind(this);
  }

  loadConfig(url){

    let self = this;

    axios
      .get(url)
      .then(function(result) {
        self.setState({config: result.data},function () {
          self.loadHXLData(self.state.config.url,self.state.config.who,self.state.config.what,self.state.config.where,self.state.config.extra);
        });
        
      });
  }

  loadHXLData(url,who,what,where,extra){

    let self = this;
    let filterParams = encodeURIComponent(who+','+what+','+where+','+extra);
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

  getNamedArray(data){
    let headers = ['name','value'];
    let output = [];
    data.forEach(function(row,i){
      if(i>0){
        let newRow = {};
        row.forEach(function(d,j){
          let header = headers[j];
          newRow[header] = d; 
        });
        output.push(newRow);
      }
    });
    return output;
  }

  getBites(data,filters){
    let self = this;
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
    if(tableBites.length>0 && tableBites[0].priority>5){
      tableText = hxlBites.render(null,tableBites[0]);
    }
    let chartBites = hxlBites.getChartBites();
    chartBites.forEach(function(bite){
      bite.bite = self.getNamedArray(bite.bite)
    });

    let mapBites = hxlBites.getMapBites();
    this.setState({introText:introText,tables:tableText,charts:chartBites,maps:mapBites});
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
          <GraphicalBites chartBites={this.state.charts} mapBites={this.state.maps} tableText={this.state.tables} />
        </div>
      );
    }

    return (
      <div>{app}</div>
    );
  }
}

export default Report3w;
