// containers/starterWindow/ActionView/ActionView.tsx

import * as React from 'react';
import { withStyles, WithStyles, createStyles } from '@material-ui/core/styles';
import logoImg from 'resources/img/logo-md.png';
import {StarterConfig} from "../../../constants/starter";
import { connect } from 'react-redux';
import {Dispatch} from "redux";
import {StoreState} from "../../../redux/state";
import * as actions from "../../../redux/modules/starter/actions";
import {MainProcessCommunicator} from "../../../controllers/mainProcessCommunicator";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import Alert from '@material-ui/lab/Alert';
import {ProjectManager} from "../../../controllers/project/projectManager";
import AddIcon from '@material-ui/icons/Add';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import CloudDownloadOutlinedIcon from '@material-ui/icons/CloudDownloadOutlined';

const styles = createStyles({
    root: {
        width: '100%',
    },
    logoImg: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    logoContainer: {
        width: '100%',
        textAlign: 'center',
        marginTop: 50,
        marginBottom: 30,
    },
    actionsContainer: {
        textAlign: 'center'
    },
    actionButton: {
        marginTop: 10,
        marginBottom: 10,
        width: 280,
        textAlign: 'left',
        paddingLeft: 30,
    },
    actionButtonLabel: {
        justifyContent: 'flex-start',
    },
    alert: {
        marginBottom: 20,
        marginLeft: 30,
        marginRight: 30,
    },
    titleText: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    descriptionText: {
        color: 'grey',
        fontSize: 16
    }
});

export interface Props extends WithStyles<typeof styles>{
    createProjectDialogOpen?: () => void,
    validationDialogOpen: (projectDir: string) => void,
    setRecentProjects: (projects: any[]) => void,
}

interface State {
    preinstallStatus: 'not_started' | 'loading' | 'complete' | 'error',
}

class ActionView extends React.Component<Props, object> {
    state: State = {
        preinstallStatus: 'not_started'
    };

    componentDidMount(): void {
        this.initActions().then(r => {});
    }

    initActions = async () => {
        this.setState({preinstallStatus: 'loading'});
        const status = await new MainProcessCommunicator().preinstallPlugins();
        this.setState({preinstallStatus: status});
    };

    handleCreateButtonClick = () => {
        this.props.createProjectDialogOpen();
    };

    handleOpenButtonClick = async () => {
        const communicator = new MainProcessCommunicator();
        const filePath = await communicator.selectDirectory();
        this.props.validationDialogOpen(filePath.toString());
        ProjectManager.UpdateRecentProjects(filePath.toString());
        const recentProjects = ProjectManager.GetRecentProjects();
        this.props.setRecentProjects(recentProjects);
    };

    handleCheckoutButtonClick = () =>{

    };

    render() {
        const {classes} = this.props;
        const {preinstallStatus} = this.state;
        const disabled = preinstallStatus !== 'complete';
        return (
            <div className={classes.root}>
                <div className={classes.logoContainer}>
                    <img src={logoImg} className={classes.logoImg} alt={""}/><br/>
                    <Typography className={classes.titleText}>{StarterConfig.ActionView.title}</Typography><br/>
                    <Typography className={classes.descriptionText}>{StarterConfig.ActionView.description}</Typography>
                </div>
                {preinstallStatus === 'loading' &&
                <Alert severity={"info"} variant={"outlined"} className={classes.alert}>Checking and installing required plugins...</Alert>
                }
                {preinstallStatus === 'error' &&
                <Alert severity={"error"} variant={"outlined"} className={classes.alert}>Unexpected error occurs</Alert>
                }
                <div className={classes.actionsContainer}>
                    <Button
                        variant={"outlined"}
                        className={classes.actionButton}
                        onClick={this.handleCreateButtonClick}
                        disabled={disabled}
                        classes={{label: classes.actionButtonLabel}}
                    >
                        <AddIcon/>&nbsp;&nbsp;
                        {StarterConfig.ActionView.action.create}
                    </Button><br/>
                    <Button
                        variant={"outlined"}
                        className={classes.actionButton}
                        onClick={this.handleOpenButtonClick}
                        disabled={disabled}
                        classes={{label: classes.actionButtonLabel}}
                    >
                        <FolderOpenIcon/>&nbsp;&nbsp;
                        {StarterConfig.ActionView.action.open}
                    </Button><br/>
                    <Button
                        variant={"outlined"}
                        className={classes.actionButton}
                        disabled={disabled}
                        classes={{label: classes.actionButtonLabel}}
                    >
                        <CloudDownloadOutlinedIcon/>&nbsp;&nbsp;
                        {StarterConfig.ActionView.action.checkout}
                    </Button><br/>
                </div>
            </div>
        )
    }
}

const mapStateToProps = (state: StoreState) => {
    return state.starter;
};

const mapDispatchToProps = (dispatch: Dispatch<actions.StarterAction>) => {
    return {
        createProjectDialogOpen: () => dispatch(actions.createProjectDialogOpen()),
        validationDialogOpen: (projectDir: string) => dispatch(actions.validationDialogOpen(projectDir)),
        setRecentProjects: (projects: any[]) => dispatch(actions.setRecentProjects(projects)),

    }
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ActionView));

