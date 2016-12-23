import React, { Component } from 'react';
import steem from 'steem';

import SignForm from './SignForm';
import { getOperation } from '../helpers/operationHelpers';
import SignPlaceholderDefault from './Placeholder/SignPlaceholderDefault';
import Loading from '../widgets/Loading';
import Icon from '../widgets/Icon';

import './Sign.scss';

export default class Sign extends Component {
  constructor(props) {
    super(props);
    this.state = {
      step: 0,
      success: false,
      error: false,
    };
  }

  resetForm = () => {
    this.setState({
      step: 0,
      error: false,
      success: false,
    });
  };

  sign = (auth) => {
    const { type } = this.props.params;
    console.log(auth);

    /* Parse params */
    const query = this.props.location.query;
    const params = {};
    for (const key in query) {
      params[key] = isNaN(query[key])
        ? query[key]
        : parseInt(query[key]);
    }

    /* Broadcast */
    this.setState({ step: 2 });
    steem.broadcast[`${type}With`](auth.wif, params, (err, result) => {
      if (!err) {
        this.setState({ success: result });
      } else {
        console.log(err);
        this.setState({ error: err.payload.error });
      }
      this.setState({ step: 3 });
    });
  };

  render() {
    const {
      step,
      success,
      error,
    } = this.state;
    const { type } = this.props.params;
    const query = this.props.location.query;
    const op = getOperation(type);

    return (
      <div className="Sign">
        <div className="Sign__content container my-2">

          { step === 0 &&
            <div>
              <SignPlaceholderDefault
                type={type}
                query={query}
                params={op.params}
              />
              <div className="form-group my-2">
                <button onClick={() => this.setState({ step: 1 })} className="btn btn-success">Continue</button>
              </div>
            </div>
          }

          { step === 1 &&
            <SignForm
              roles={op.roles}
              sign={this.sign}
            />
          }

          { step === 2 && <Loading /> }

          {
            step === 3 && success &&
              <div>
                <h1>
                  <Icon name="done" lg/>
                  { ' ' }
                  Success!
                </h1>
                <ul className="list-group text-xs-left">
                  <li className="list-group-item">
                    Ref Block Num:<b> { success.ref_block_num }</b>
                  </li>
                  <li className="list-group-item">
                    Ref Block Prefix:<b> { success.ref_block_prefix }</b>
                  </li>
                </ul>
              </div>
          }

          {
            step === 3 && error &&
              <div>
                <h3>
                  <Icon name="info" lg/>
                  { ' ' }
                  Oops, something goes wrong!
                </h3>

                <div className="alert alert-danger">
                  <strong>Error code: { error.code }</strong> { error.data.message }
                </div>

                <a href="#" onClick={this.resetForm}>Try Again</a>
              </div>
          }
        </div>
      </div>
    );
  }
}