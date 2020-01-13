import React, {Component, PropTypes} from "react";
import {connect} from "react-redux";
import {loadTagTypePainting, loadTagTypePaintingHot} from "../redux/modules/models/Painting";
import PureListView from "./PureListView";


class TagTypePainting extends Component {


  static propTypes = {
    painting: PropTypes.object,
    tagType: PropTypes.string,
    loadTagTypePainting: PropTypes.func,
    loadTagTypePaintingHot: PropTypes.func,
    navigation: PropTypes.object,
  };

  static navigatorStyle = {
    tabBarHidden: true,
    navBarButtonColor: '#05AD97',
  };

  render() {
    const {
      component, painting, profile, orderPainting,
      loadTagTypePainting, loadTagTypePaintingHot, tagType,
      paintingHeat, navigation
    } = this.props;
    const load = orderPainting.orderType == '热门' ? loadTagTypePaintingHot : loadTagTypePainting;
    const orderType = orderPainting.orderType == '热门' ? 'Hot' : 'Latest';
    const component_orderType = orderPainting.orderType == '热门' ? tagType + '热门' : tagType;
    return (
      <PureListView painting={painting}
                    component={component[component_orderType]}
                    orderType={orderType}
                    loadPainting={load}
                    navigation={navigation}
                    navigator={this.props.navigator}
                    profile={profile}
                    tagType={tagType}
                    paintingHeat={paintingHeat}
      />

    )
  }

}


export default connect(
  (state, ownProps) => ({
    painting: state.models.painting,
    me: state.me,
    component: state.containers.tagTypePainting,
    profile: state.models.profile,
    orderPainting: state.containers.orderPainting,
    paintingHeat: state.models.paintingHeat
  }),
  {
    loadTagTypePainting,
    loadTagTypePaintingHot

  }
)(TagTypePainting);
