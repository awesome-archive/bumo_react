import React, {Component, PropTypes} from "react";
import {bindActionCreators} from "redux";
import {load as loadMe, update as updateMe} from "../../redux/modules/me";
import {Link} from "react-router";
import {reduxForm} from "redux-form";
import {createNotification} from "../../redux/modules/notification";
import "./EditMe.scss";
import {openCharge} from "../../redux/modules/containers/CreateCharge";

@reduxForm({
    form: 'updateMe',
    fields: ['nickname', 'introduction', 'description'],
  },
  (state) => ({
    me: state.me,
    component: state.containers.MeUpdate,
    initialValues: {
      nickname: state.me.nickname,
      introduction: state.me.introduction ? state.me.introduction : '',
      description: state.me.description ? state.me.description : ''
    }
  }),
  dispatch => bindActionCreators({
    loadMe,
    updateMe,
    createNotification,
    openCharge
  }, dispatch)
)


export default class updateMeForm extends Component {
  static propTypes = {
    me: PropTypes.object,
    loadMe: PropTypes.func,
    fields: PropTypes.object,
    createNotification: PropTypes.func,
    component: PropTypes.object,
    updateMe: PropTypes.func
  };

  componentWillMount() {
    this.props.loadMe();
  }

  componentWillReceiveProps(nextProps) {
    const{profile_update}=this.props.component;
    console.log(profile_update);
    if(profile_update)
    {this.props.createNotification({
      message: <div className="success">资料更新成功</div>,
      level: 'success'
    });}

  }



  handleSubmit = (event) => {
    event.preventDefault();
    console.log(event);
    this.props.updateMe({
      nickname: this.refs.nickname.value,
      introduction: this.refs.introduction.value,
      description: this.refs.description.value,
    });
  };

  createCharge(){
    this.props.openCharge();
  }

  render() {
    const {component, fields:{nickname, introduction, description}, me} = this.props;
    return (
      <div className="EditMe__container">
        <div className="grid-content grid-container pageHead">
          <h1>账户设定</h1>
        </div>
        <div className="grid-block grid-container medium-up-2 small-up-1">
          <form className="grid-content">
            <label>
              <div>用户名(不可修改)</div>
              <input type="text" value={me.username} readOnly={true}/>
            </label>
            <label>
              <div>昵称*</div>
              {component.error ? (component.error.nickname ? <div>昵称不能为空</div> : '') : ''}
              <input type="text" ref="nickname" {...nickname}/>
            </label>
            <label>
              <div>简介</div>
              <input type="text" ref="introduction" {...introduction}/>
            </label>
            <label className="hide">
              <div>描述</div>
              <input type="text" ref="description" {...description}/>
            </label>
            <a className="button" onClick={this.handleSubmit}>保存</a>
          </form>
          <div className="grid-content">
            <div className="EditMe__balance">
              <h5>余额</h5>
              <div className="EditMe__balance_hp">
                <i className="zmdi zmdi-favorite"/>HP {(me.balance ? me.balance.free_qb : '')}
                <span className="EditMe__hint">每小时自动 +1</span>
              </div>
              <div className="EditMe__balance_mp">
                <span><i className="zmdi zmdi-star"/>MP {(me.balance ? me.balance.charged_qb : '')}</span>
                <a className="EditMe__balance_add-mp button small" onClick={this.createCharge.bind(this)}> 补充MP(暂未开放) </a>
                <Link className="EditMe__balance_add-mp button small" to="/me/depositList"> 支付历史 </Link>

              </div>
              <Link className="hide" to="me/createCharge">
                <div className="button">充值</div>
              </Link>
            </div>
            <div className="EditMe__income">
              <h5>收入</h5>
              <div className="EditMe__income_mp">
                <span><i className="zmdi zmdi-star"/>MP {(me.balance ? me.balance.earned_qb : '')}</span>
                <Link disabled={true} className="button small EditMe__income_mp-transfer disabled" to="/"> 转入余额(暂未开放) </Link>
                <Link disabled={true} className="button small EditMe__income_mp-deposit disabled" to="/"> 提取(暂未开放) </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

    )
      ;
  }
}
