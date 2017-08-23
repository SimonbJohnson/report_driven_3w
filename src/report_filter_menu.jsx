import React, { Component } from 'react';
import { Dropdown } from 'semantic-ui-react'

class FilterMenu extends Component {

  render() {
    return (
    	<div>
	    	<p>I'm interested in</p>
	  		<Dropdown id="whofilter" placeholder='All Organisations' search selection options={this.props.whoOptions} onChange={this.props.filterHandler}/>
	  		<Dropdown id="whatfilter" placeholder='All Activities' search selection options={this.props.whatOptions} onChange={this.props.filterHandler}/>
	  		<Dropdown id="wherefilter" placeholder='All Places' search selection options={this.props.whereOptions} onChange={this.props.filterHandler} />
	  	</div>
    );
  }
}

export default FilterMenu;
