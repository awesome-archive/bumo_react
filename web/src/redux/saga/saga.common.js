// import {fork, call, take, put} from 'redux-saga'
import {call, fork, put, select, take} from "redux-saga/effects";
import * as authModule from "../modules/auth";
import * as meModule from "../modules/me";
import * as userPaintingModule from "../modules/models/UserPainting";
import * as depositModule from "../modules/containers/Deposit";
import * as getChargeModule from "../modules/models/Deposit";
import * as MainHeaderModule from "../modules/containers/MainHeader";
import * as LikeActionModule from "../modules/containers/LikeAction";
import * as PaintingDetailModule from "../modules/models/PaintingDetail";
import * as ChargeWindowModule from "../modules/containers/ChargeWindow";
import {createNotification} from "../../redux/modules/notification";
import * as DepositCreateModule from "../modules/containers/CreateCharge";
import {checkTokenValid} from "../../utils/common";
import {removeItem, setItem} from "../../helpers/storage";

const TRULY = true;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function* loadMeOrLogout() {
  const {valid, needRefresh} = yield call(checkTokenValid);
  if (valid) {
    return yield put(meModule.load());
  } else if (needRefresh) {
    return yield put(authModule.logout());
  }
}

function* initialApp() {
  yield take(authModule.INITIAL_APP);
  yield call(loadMeOrLogout);
}

function* loginSuccess() {
  while (TRULY) {
    const {result} = yield take(authModule.LOGIN_SUCCESS);
    yield setItem('token', result.token);
    yield call(loadMeOrLogout);
  }
}

function* loginFail() {
  while (TRULY) {
    const {error} = yield take(authModule.LOGIN_FAIL);
    if (error && error.err === 'not_user') {
      const auth0 = yield select(state => state.auth.auth0);
      const {email_verified, email, user_id} = auth0;
      const userType = user_id.split('|')[0];
      switch (userType) {
        case 'auth0':
          if (email_verified) {
            yield put(authModule.register());
          } else {
            yield put(createNotification({
              message: `我们已经向您发送了一封确认邮件，请前往您的邮箱「${email}」确认`,
              level: 'warning'
            }));
          }
          break;
        case 'weibo':
          yield put(authModule.register());
          break;
        default:
          console.warn('unknow user type', userType);
      }
    }
  }
}

function* updateAvatarOrBanner() {
  while (TRULY) {
    yield take([meModule.UPLOAD_AVATAR_SUCCESS, meModule.UPLOAD_BANNER_SUCCESS]);
    yield put(MainHeaderModule.modalClose());
    const userId = yield select(state => state.me.id);
    yield put(userPaintingModule.loadProfileDetail(userId));
    yield call(loadMeOrLogout);
  }
}

function* updateMe() {
  while (TRULY) {
    const {result} = yield take([meModule.INITIAL_UPDATE_ME, LikeActionModule.FREE_LIKE_SUCCESS, LikeActionModule.PAY_LIKE_SUCCESS]);
    yield call(loadMeOrLogout);
  }
}

function* intialUpdateMe() {
  while (TRULY) {
    const {result} = yield take(meModule.UPDATE_SUCCESS);
    yield put(meModule.initialUpdateMe());

  }
}

function* updateMeEveryQuarterHour() {
  while (TRULY) {
    yield delay(15 * 60 * 1000);
    yield call(loadMeOrLogout);
  }
}

function* registerSuccess() {
  while (TRULY) {
    const {result} = yield take(authModule.REGISTER_SUCCESS);
    yield setItem('token', result.token);
    yield call(loadMeOrLogout);
    yield put(MainHeaderModule.modalClose());
  }
}

//交易对象成功建立时
function* depositCreateSuccess() {
  while (TRULY) {
    const {result} =yield take(DepositCreateModule.CREATE_CHARGE_SUCCESS);
    const chargeChannel = yield select(state => state.containers.CreateCharge.channel);
    const chargeLink = yield select(state => state.containers.CreateCharge.credential[chargeChannel]);
    yield put(ChargeWindowModule.openPayCharge(chargeLink));
  }
}


function* logout() {
  while (TRULY) {
    yield take(authModule.LOGOUT);
    yield removeItem('token');
    yield removeItem('preAuth');
    yield put({type: authModule.LOGOUT_SUCCESS});
  }
}

function* depositNextPageLoaded() {
  while (TRULY) {
    yield take(getChargeModule.GET_CHARGE_SUCCESS);
    // yield delay(2000);
    yield put({type: depositModule.GoDepositNextPage});
  }
}

function* depositLastPageLoaded() {
  while (TRULY) {
    const action = yield take(depositModule.GoDepositLastPage);
    // yield delay(2000);
    yield put(getChargeModule.getCharge(action.page - 2));
  }
}

function* checkPayCharge() {
  while (TRULY) {
    const {result} = yield take(DepositCreateModule.CREATE_CHARGE_SUCCESS);
    yield delay(5000);
    yield put(getChargeModule.checkCharge(result.id))
  }
}

//每5秒检查是否支付成功,1小时之后失效
function* checkCharge() {
  while (TRULY) {
    yield take(getChargeModule.CHECK_CHARGE_FAIL);
    const chargerId = yield select(state => state.containers.CreateCharge.id);
    const chargeTime = yield select(state => state.containers.CreateCharge.createTime);
    const nowTime = new Date();
    const gapTime= (nowTime- new Date(chargeTime))/1000/3600;
    console.log('gatTime', gapTime);
    if(gapTime <= 1) {
      yield delay(5000);
      yield put(getChargeModule.checkCharge(chargerId))
    }
  }
}

function* checkChargeSuccess() {
  while (TRULY) {
    yield take(getChargeModule.CHECK_CHARGE_SUCCESS);
    yield put(ChargeWindowModule.closePayCharge());
    yield put(getChargeModule.getCharge())
  }

}


function* loadPaintingChecking() {
  while (TRULY) {
    const {result} = yield take(PaintingDetailModule.LOAD_DETAIL_SUCCESS);
    if (result.status !== 2) {
      yield put(createNotification({
        message: '画作正在审核中,审核完毕会出现在首页上',
        level: 'warning'
      }));
    }
  }
}

function* createChargeFail () {
  while (TRULY) {
    yield take(DepositCreateModule.CREATE_CHARGE_FAIL);
    yield put(DepositCreateModule.cancelCreateCharge());
    yield put(DepositCreateModule.openCharge());
  }
}


export default function* root() {
  yield [
    fork(loginSuccess),
    fork(loginFail),
    fork(logout),
    fork(registerSuccess),
    fork(updateMe),
    fork(updateMeEveryQuarterHour),
    fork(depositNextPageLoaded),
    fork(depositLastPageLoaded),
    fork(updateAvatarOrBanner),
    fork(initialApp),
    fork(intialUpdateMe),
    fork(loadPaintingChecking),
    fork(depositCreateSuccess),
    fork(checkPayCharge),
    fork(checkCharge),
    fork(checkChargeSuccess),
    fork(createChargeFail)
  ];
}
