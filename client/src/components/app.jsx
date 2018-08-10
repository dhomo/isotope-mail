import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import TopBar from './top-bar/top-bar';
import SideBar from './side-bar/side-bar';
import {FolderTypes, getFolders} from '../services/folder';
import {addFolder} from '../actions/folders';
import {addMessage} from '../actions/messages';
import mainCss from '../styles/main.scss';
import styles from './app.scss';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sideBar: {
        collapsed: false
      }
    };
  }

  render() {
    return (
      <div className={styles.app}>
        <TopBar sideBarCollapsed={this.state.sideBar.collapsed} sideBarToggle={this.toggleSideBar.bind(this)}/>
        <SideBar collapsed={this.state.sideBar.collapsed}/>
        <div className={`${mainCss['mdc-top-app-bar--fixed-adjust']} ${styles['message-grid-wrapper']}`}>
          <div className={styles['message-grid']}>
            <ul className={`${mainCss['mdc-list']}`}>
              {this.props.messages.map((message, key) =>
                <li className={mainCss['mdc-list-item']} key={key}>{message.subject}</li>)}
            </ul>
          </div>
          <div className={styles['fab-container']}>
            <button className={`${mainCss['mdc-fab']}`} onClick={this.props.addMessage.bind(this)}>
              <span className={`material-icons ${mainCss['mdc-fab__icon']}`}>edit</span>
            </button>
            <button className={`${mainCss['mdc-fab']}`} onClick={this.props.addFolder.bind(this)}>
              <span className={`material-icons ${mainCss['mdc-fab__icon']}`}>folder</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.props.resetFolders();
    document.title = this.props.application.title;
  }

  toggleSideBar() {
    const toggleCollapsed = !this.state.sideBar.collapsed;
    this.setState({
      sideBar: {
        collapsed: toggleCollapsed
      }
    });
  }
}

App.propTypes = {
  application: PropTypes.object.isRequired,
  messages: PropTypes.array.isRequired,
  resetFolders: PropTypes.func.isRequired,
  addFolder: PropTypes.func.isRequired,
  addMessage: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  application: state.application,
  messages: state.messages
});

const mapDispatchToProps = dispatch => ({
  resetFolders: () => {
    // dispatch(addFolder({name: 'New Folder'}));
    getFolders(dispatch);
  },
  addFolder: () => {
    dispatch(addFolder({fullURL: 'FU', name: 'New Folder', type: FolderTypes.FOLDER, children: []}));
  },
  addMessage: () => {
    dispatch(addMessage({subject: 'New Message'}));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
